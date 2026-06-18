---
tags: ['效能測試', '負載測試', 'Performance Testing', 'TAU 課程筆記', 'QA 學習']
---

# QA 也要懂效能測試：TAU 課程完整筆記

QA 常遇到這個問題：功能測試都通過了，上線後使用者說「網站好慢」。

你打開 Chrome 看了一下，好像沒什麼問題？但換 4G 環境、換舊一點的手機，問題就出現了。更慘的是活動當天流量衝高，伺服器直接掛掉。

這些問題都不在 functional test 的射程之內。

這篇是我上完 Test Automation University 的 *Introduction to Performance and Load Testing* 的完整筆記。這門課不深入任何一個工具，但它把「該怎麼想效能測試」的框架說得非常清楚，對 QA 非常實用。

---

## 課程概覽

**課程名稱**：Introduction to Performance and Load Testing
**平台**：Test Automation University（免費）
**章節**：5 章
**工具涵蓋**：Chrome DevTools、Lighthouse、PageSpeed Insights、JMeter、Gatling

---

## 先搞清楚：效能測試 vs 負載測試

這兩個詞常被混用，但它們是不同的東西。

**效能測試（Performance Testing）**：測量**單一客戶端**的速度和回應時間。例如：
- 頁面載入時間
- 某個按鈕按下去到回應需要多久
- API 回傳一筆資料要幾毫秒

**負載測試（Load Testing）**：測量**服務在大量請求下的承載能力**。例如：
- 1000 個使用者同時登入，系統還能正常運作嗎？
- 活動當天流量是平常的 10 倍，伺服器會不會掛？

兩種測試都很重要，但解決的問題完全不同。

---

## 客戶端效能：影響使用者體驗的五個因素

就算伺服器沒問題，客戶端也可能很慢。課程列出了五個關鍵因素：

| 因素 | 說明 |
|------|------|
| **網路條件** | 影響最大。Wi-Fi、4G、3G 的體驗差異極大 |
| **資源數量與大小** | 需要載入多少圖片、JS、CSS，每個多大 |
| **Script 執行** | JS 太多或有 bug 會讓頁面卡頓、無法互動 |
| **圖片渲染** | 圖片多、解析度高，行動裝置渲染特別耗費資源和電量 |
| **Server 回應** | API 慢，頁面感覺就慢 |

測試客戶端效能時，要關注的問題：
- 使用者**什麼時候看到畫面**（FCP）？
- 使用者**什麼時候可以操作**（TTI）？
- 有沒有**多餘的資源**或**重複的 API 呼叫**？
- 網路使用有沒有優化（CDN、快取）？

---

## 瀏覽器工具：不用任何專門工具就能開始

### Chrome DevTools — Performance 分析

**測試前先開無痕視窗**，避免瀏覽器擴充套件干擾結果。

打開 DevTools → Performance tab → 按下重新載入，Chrome 會記錄整個載入過程，產出完整的時間軸，可以看到：
- 每個資源（圖片、JS、CSS）的載入順序和時間
- JS 主執行緒的使用狀況（是否 blocking）
- 使用者首次可以互動的時間點

### Lighthouse / PageSpeed Insights

Lighthouse 是 Google 內建的審計工具，可以直接在 Chrome DevTools 裡跑，也可以用 PageSpeed Insights 網頁版。

它會給你一個綜合分數，並列出具體的改善建議，例如：
- 圖片沒有使用現代格式（WebP）
- 沒有延遲載入 off-screen 圖片
- 有阻塞渲染的 JavaScript
- 需要壓縮的資源

**關鍵指標**：
- **FCP**（First Contentful Paint）：使用者首次看到內容
- **LCP**（Largest Contentful Paint）：最大內容元素載入完成
- **CLS**（Cumulative Layout Shift）：版面跑版程度
- **TTI**（Time to Interactive）：頁面完全可互動

### 手機效能測試

行動裝置有額外的挑戰：
- 網路不穩定（4G、3G）
- CPU 和記憶體比桌機弱
- 使用者可能在用計費流量，下載大圖會讓人很不爽
- 複雜的圖片渲染會耗電

Chrome DevTools 的 Performance tab 有**行動模式**，可以模擬特定裝置（Galaxy S5、iPhone 等）和網路條件（3G、慢速 4G），讓你在桌機上就能重現行動端的體驗。

PageSpeed Insights 預設會同時跑桌面和手機版分析，兩個分數差異很大是常態，值得特別關注手機版的分數。

---

## 負載測試工具怎麼選？

工具非常多，沒有唯一答案。課程給了很實用的選擇框架：

**考量一：開源 vs 商業**

- 公司已有 LoadRunner 等商業授權 → 直接用
- 剛開始 → 開源工具起步，之後再視需求升級企業版

**考量二：本地 vs 雲端**

- 本地跑：網路條件受控，適合測試內網服務
- 雲端服務：省掉自己管理基礎設施，但費用較高

**考量三：UI 介面 vs 純腳本**

- 不熟悉 coding → **JMeter**（圖形介面，拖拉設定）
- 開發者 / 熟悉 code → **Gatling**（Scala DSL）、**k6**（JavaScript）

**考量四：團隊既有的技術棧**

如果公司已有人熟悉某個工具，盡量複用那個知識，學習成本更低。

### JMeter 快速認識

JMeter 是最多人用的開源負載測試工具，有 GUI 可以操作：
- **Thread Group**：設定虛擬使用者數、爬升時間、執行次數
- **Samplers**：設定要測試的 HTTP 請求
- **Listeners**：看測試結果（回應時間、吞吐量、錯誤率）

適合習慣視覺化操作的人，但產出的腳本在 CI 整合上需要多一些設定。

### Gatling 快速認識

Gatling 用 Scala DSL 寫腳本，腳本即是文件：

```scala
scenario("預訂查詢")
  .exec(http("查詢所有預訂")
    .get("/booking"))
  .pause(1)
  .exec(http("查詢單筆預訂")
    .get("/booking/1"))
```

結果會產出漂亮的 HTML 報告，容易整合進 CI。適合習慣寫 code 的工程師。

---

## 負載測試策略：從哪裡開始？

### 第一步：了解你在測什麼系統

在設計測試之前，先搞清楚系統架構：
- 是**單體應用**還是**微服務**？
- 有沒有**第三方依賴**（認證服務、支付、外部 API）？
- 資料庫的連接池設定是否合理？有沒有快取（Redis、Kafka）？
- 在**本地**、**雲端**還是**Serverless** 環境運行？

這些都會影響你的測試設計和結果解讀。

### 第二步：找出值得測試的 API

不是每個 API 都需要負載測試，要聚焦在：
- **最常被呼叫**的 API（流量最高）
- **最耗時**的 API（慢於 250ms 就要注意）
- **最關鍵**的 API（掛掉影響最大）

從生產環境的監控資料找答案最準確。如果有接 APM 或可觀測性工具，直接看 production trace。

**快速贏得效能改善的三個地方**：
1. **慢的 API**（>250ms）
2. **重複呼叫**（同一個資料叫了多次）
3. **呼叫順序不對**（可以並行的 API 被串行執行）

### 第三步：設計測試情境

幾種常見的測試類型：

| 測試類型 | 目的 |
|---------|------|
| **Session-based Test** | 模擬真實使用者操作流程（登入 → 瀏覽 → 購買）|
| **Spike Test** | 突然大量使用者湧入，看系統能否撐住 |
| **Soak Test** | 長時間持續負載，找出記憶體洩漏或性能衰退 |
| **Stress Test** | 逐步加壓到超出系統上限，找出崩潰點 |

設計情境時要模擬**真實的使用比例**。例如電商的讀寫比例可能是 90:10（大部分人在瀏覽，少數人在下單），別把所有測試都放在寫入操作。

### 第四步：呈現結果

測試跑完，要怎麼解讀？

關鍵數字：
- **平均回應時間**（Average Response Time）
- **百分位數**（P95、P99）：90% 的使用者等不超過多久
- **吞吐量**（Throughput）：每秒能處理幾個請求
- **錯誤率**（Error Rate）：在負載下出錯的比例

P95 比平均更重要。平均值容易被少數超慢的請求拉低，P95 告訴你「95% 的使用者的體驗上限」。

---

## 我的總結

這門課讓我對效能測試有了更完整的認識，特別是幾個之前模糊的地方：

**效能測試不只是「跑 JMeter」**。在跑負載測試之前，先用 Chrome DevTools 和 Lighthouse 做客戶端效能分析，往往就能找到大量的快速改善點——而且不需要任何特別的工具。

**工具不是重點，策略才是**。選 JMeter 還是 Gatling，沒有對錯，取決於你的團隊。但知道「測什麼、什麼時候測、測到什麼程度」，才是真正決定負載測試是否有價值的關鍵。

**看 P95，不看平均值**。平均值會說謊，P95/P99 才能真正描述使用者體驗。

如果你的團隊還沒有任何效能測試，這門課是很好的起點，它幫你建立概念框架，而不是讓你被工具淹沒。

---

課程連結：[TAU - Introduction to Performance and Load Testing](https://testautomationu.applitools.com/performance-and-load-testing/)

---

## 參考資料

- [Test Automation University — Performance and Load Testing](https://testautomationu.applitools.com/performance-and-load-testing/) — 本文課程來源
- [k6 — Test Types](https://k6.io/docs/test-types/) — smoke、load、stress、soak 各類型測試定義
- [ISTQB — Performance Testing Certification](https://www.istqb.org/certifications/performance-tester) — 效能測試專業認證標準
- [Web.dev — Core Web Vitals](https://web.dev/articles/vitals) — Google 定義的核心效能指標（LCP、INP、CLS）
- [Google DORA — Accelerate State of DevOps 2024](https://dora.dev/research/2024/dora-report/) — DevOps 效能指標與部署頻率研究
