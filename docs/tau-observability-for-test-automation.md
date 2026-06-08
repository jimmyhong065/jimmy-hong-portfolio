---
tags: ['自動化測試', '可觀測性', 'Observability', 'TAU 課程筆記', 'QA 學習']
---

# 測試自動化的可觀測性：TAU 課程完整筆記

你有沒有這種感覺：CI 跑完了，測試結果出來了，但你卻不知道「今天這一跑」和「昨天那一跑」有什麼差別？

某幾個測試又失敗了，但你不確定是 flaky、是環境問題、還是真的有 regression？Pipeline 越跑越慢，但你不知道是哪個步驟變慢了？

這門課就是在解決這個問題。

這篇是我上完 Test Automation University 上 *Introduction to Observability for Test Automation* 的完整筆記，加上自己的理解。課程 18 個章節，實作上用 Selenium + GitHub Actions + Prometheus + Honeycomb，概念上打通了「為什麼光看 pass/fail 不夠」的底層邏輯。

---

## 課程概覽

**課程名稱**：Introduction to Observability for Test Automation
**平台**：Test Automation University（免費）
**時長**：約 3 小時 23 分鐘 ／ 18 章節
**工具**：GitHub Actions、Maven、Selenium、Prometheus、Pushgateway、Honeycomb.io

---

## 從「監控」到「可觀測性」

### 遙測（Telemetry）是什麼

課程一開始先講 telemetry——系統產生的所有資料，包含：
- **基礎設施層**：Server、資料庫
- **網路層**：HTTP 請求、延遲
- **應用層**：我們自己寫的軟體行為

有兩種 telemetry：
- **自動生成的**：測試工具本身就會輸出 log，例如跑 Selenium 時的 console 訊息
- **自訂的**：自己加的，例如某個測試失敗時記錄的特定錯誤訊息

自訂 telemetry 才是最有價值的，因為它是你自己定義「什麼對你最重要」。

### 監控 vs 可觀測性

這個區別很多人模糊，課程給了一個清楚的框架。

**傳統監控（Monitoring）**做的事：
- 記錄數字
- 設定閾值觸發警報
- 看 dashboard 發現「CPU 升高的同時，CI 也變慢了」

這很有用，但有個根本限制：**你只能回答你預先知道要問的問題**。

Dashboard 上的每一個圖表，都是你事先決定要追蹤的指標。如果出現了你沒預料到的異常行為，監控系統只能告訴你「有東西壞了」，但沒辦法幫你找到是什麼。

**可觀測性（Observability）**加上了什麼？

可觀測性的核心是讓你能夠**探索系統的未知狀態**。不只是「我設定了哪些圖表」，而是「我可以任意詢問系統任何問題」。

用測試自動化的語言來說：
- 監控：「這個月的失敗率是多少？」（你之前就決定要追蹤這個）
- 可觀測性：「為什麼今天下午 3 點這個測試突然變慢？是哪個 commit 觸發的？是在哪個 CI step 花最多時間？」（這是你看到異常之後才想問的問題）

調查一個問題的生命週期：
1. **識別**：發現有異常（Metrics 很擅長這個）
2. **調查與分類**：找出原因（Metrics 在這裡開始不夠用了）
3. **修復與監控**：確認修好了，長期追蹤

---

## 幫測試套件定義指標

### GitHub Actions 的資訊缺口

課程用 GitHub Actions + Selenium 做示範。你進去看 Actions 的 run history，會看到：
- 哪個 commit 觸發了這次執行
- 是誰 push 的
- 這個 job 總共跑了多久

但看不到：
- 每個 step 分別花了多少時間
- 為什麼這次比上次慢了 30 秒
- 失敗率的趨勢是上升還是下降

這就是指標的用武之地。

### 值得追蹤的測試指標

課程提出了幾個對測試自動化最有意義的指標：

| 指標 | 說明 |
|------|------|
| Step 執行時長 | 每個 CI step 花了多久，找出瓶頸 |
| 測試通過數 / 失敗數 | 每次 run 的結果分布 |
| 測試套件總時長 | 整體執行時間的趨勢 |
| 失敗的測試名稱 | 哪些測試一直在失敗 |

### 用 Bash 腳本提取測試資料

課程示範怎麼從 Maven Surefire 的 XML 報告中提取數字，並轉換成可推送給 Prometheus 的格式。這不需要很複雜的工具，幾行 Bash 就能做到：

```bash
# 計算通過和失敗的測試數
tests_passed=$(grep -o 'failures="0"' target/surefire-reports/*.xml | wc -l)
tests_failed=$(grep -o 'failures="[1-9]' target/surefire-reports/*.xml | wc -l)

# 記錄時間戳
start_time=$(date +%s)
# ... 執行測試 ...
end_time=$(date +%s)
duration=$((end_time - start_time))
```

---

## Prometheus：把指標存起來

### 為什麼需要外部儲存

把指標印出來還不夠，你需要能夠：
- **跨時間比較**：今天和上週的失敗率有沒有變化？
- **在 CI 之外查詢**：不用每次都點進 GitHub Actions

Prometheus 是一個開源的指標資料庫，工作模式是「拉取（pull/scrape）」：它會定期去你指定的 URL 拿資料。

### Pushgateway：解決 CI 環境的問題

但 GitHub Actions 是短暫的環境，Prometheus 無法直接 scrape 一個已經消失的 CI job。

解法是 **Pushgateway**：CI job 把指標「推」給 Pushgateway，Pushgateway 把資料留著，讓 Prometheus 去 scrape。

架構長這樣：

```
GitHub Actions → push metrics → Pushgateway ← scrape ← Prometheus ← query ← Grafana
```

### Cardinality：指標的進階概念

光有名稱和數值還不夠。例如你知道「今天有 3 個測試失敗」，但你不知道**是哪 3 個**。

解法是給指標加上 **label（標籤）**：

```
github_actions_failed_tests{test_name="LoginTest", commit="abc123", branch="main"} 1
```

但這裡有個陷阱叫 **Cardinality（基數）**：label 的組合數量不能太多，否則 Prometheus 的儲存和查詢會爆炸。

課程給的原則：
- 用 label 記錄「有限集合」的值，例如 branch 名稱、測試名稱
- 不要把 timestamp、user ID 這類無限增長的值放進 label

---

## 指標的極限，以及「事件」的出現

### 三個支柱的迷思

你可能聽過 Observability 的「三個支柱」：Metrics（指標）、Logs（日誌）、Traces（追蹤）。

課程對這個說法提出了批評。

這三個支柱的問題是：它們是**三種不同的資料儲存格式**，在傳統工具中沒辦法跨格式做關聯查詢。你的 metric 在一個地方，log 在另一個地方，trace 在第三個地方。當你要調查一個問題時，要在三個系統之間跳來跳去。

更根本的問題：指標擅長「識別問題」，但不擅長「調查問題」。

Metric 能告訴你「失敗率在昨天下午升高了」，但沒辦法告訴你「那次失敗的測試，執行時的環境是什麼？依賴的 API 返回了什麼？」

### 事件資料結構（Event）

取代三個支柱的概念是 **Event（事件）**：把所有你想知道的資訊，打包成一個時間戳記的結構化物件。

一個測試執行的事件可能長這樣：

```json
{
  "timestamp": "2026-06-04T14:23:00Z",
  "duration_ms": 1523,
  "test_name": "LoginTest",
  "result": "failed",
  "commit": "abc123",
  "branch": "main",
  "browser": "chrome",
  "error_message": "Element not found: #submit-btn",
  "ci_run_id": "12345"
}
```

這個結構的優點：**你可以用任何欄位去 filter、group、query**，不需要事先定義要追蹤什麼。這才是「可觀測性」的精髓。

### Honeycomb：事件資料庫的代表

課程用 Honeycomb.io 示範事件查詢。你可以：
- 用任意欄位組合篩選
- 按照任意欄位聚合
- 把時間維度加進去看趨勢

例如：「找出所有在 `main` branch 上，test duration 超過 2 秒，且最終失敗的測試，按照 test_name 分組，看過去一週的趨勢。」

這種查詢，用 Metrics + Logs + Traces 的三支柱架構幾乎不可能做到，但在事件模型裡只需要幾個 filter。

---

## 從 CI Pipeline 產生 Trace

課程的最後幾章示範怎麼把整個 CI pipeline 的執行過程，記錄成一個 trace 事件。

使用 **Build Events** 這個工具，你可以在 GitHub Actions workflow 裡加幾行，把整個 build 的時間軸記錄下來，包括每個 step 的開始時間、結束時間、成功失敗狀態，全部打包成一個 trace 推到 Honeycomb。

這讓你可以：
- 視覺化看到整個 pipeline 的時間分布
- 發現哪個 step 比上次慢了
- 把 build 結果和測試失敗關聯起來

---

## 我的總結

這門課讓我重新思考了一個問題：**CI 結果的「綠燈」和「紅燈」，只是最粗粒度的資訊**。

我們有沒有能力回答：
- 這個測試為什麼今天失敗了，但昨天沒有？
- 這次 CI 跑了 8 分鐘，上週是 5 分鐘，多的 3 分鐘在哪？
- 這個月失敗次數最多的測試是哪個？

如果沒辦法，我們其實是在「盲目駕駛」——只知道有沒有撞牆，但不知道前方的路況。

可觀測性不是一個工具，而是一種思維方式：**把測試自動化當成一個系統來對待，並且用對待生產系統的方式去監控和調查它**。

---

課程連結：[TAU - Introduction to Observability for Test Automation](https://testautomationu.applitools.com/observability-for-test-automation/)
