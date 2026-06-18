---
tags: ['測試策略', '自動化', 'QA 思維']
---

# 什麼情況下不該自動化？停下來比衝快更重要

自動化是 QA 的標配技能，卻也是最常被誤用的工具。

許多團隊把「自動化覆蓋率」當成 KPI，工程師花了三個月寫測試，CI 跑起來綠燈，但上線後照樣出包。不是測試不夠多，而是測錯了地方。

這篇文章談的不是「怎麼自動化」，而是「何時你根本不應該自動化」。

---

## 自動化的本質：把判斷轉移給機器

自動化測試的核心假設是：「這個行為未來會重複出現，而且判斷標準是固定的。」

如果這兩個條件有一個不成立，自動化就會產生維護成本，卻帶不來相應的價值。

Lisa Crispin 和 Janet Gregory 在《Agile Testing》中提出了測試四象限（Testing Quadrants）：面向業務的探索性測試和使用者驗收測試，本質上需要人類判斷，強行自動化反而降低品質。

---

## 五種不適合自動化的場景

### 1. 需求還沒穩定的功能

新功能在前三個 Sprint 往往會大改。這時候寫的自動化測試，通常在第二個 Sprint 就要全部重寫。

**實際成本：** Capers Jones 在《Applied Software Measurement》的分析顯示，需求變動是自動化測試失效的首要原因，佔所有測試失效的 45% 以上。需求不穩時，與其自動化，不如用探索性測試快速驗證方向，等功能定型後再投入自動化。

**判斷標準：** 如果 PM 在上週還改過這個功能的驗收條件，先不要自動化。

---

### 2. 只跑一次的場景

資料庫 migration 驗證、特定版本的相容性測試、一次性的資料清理確認——這些只需要執行一次，自動化的 ROI 是負的。

寫一個腳本跑完確認就刪掉，比維護一個永遠只跑一次的測試套件更合理。

---

### 3. 高度依賴視覺判斷的測試

「這個對齊看起來怪怪的」、「這個顏色在 iPhone 15 上偏暗」、「這個動畫感覺太急促」——這類判斷人類只要看一眼就知道，寫成自動化斷言卻幾乎不可能精準。

Selenium 可以截圖比對像素，但 UI 設計師改了 2px 的 padding，你的測試就全紅。Visual regression testing 工具（如 Percy、Chromatic）適合**元件層級的差異偵測**，但無法取代人對整體視覺品質的判斷。

---

### 4. 容易 Flaky 的測試

Google 在 2017 年發表的研究《Where Do Our Flaky Tests Come From?》分析了 Google 內部測試基礎設施，發現約 **1.5% 的測試執行會出現 flaky（不穩定）行為**，而這些 flaky tests 會讓開發者對整個測試套件失去信任。

更嚴重的是：一旦開發者習慣看到紅燈就「re-run 一次」，整個 CI 的防護作用就瓦解了。

**常見 Flaky 來源：**
- 依賴外部 API 或第三方服務
- 有 race condition 的非同步操作
- 依賴系統時間或時區
- 測試之間有狀態共享

如果一個測試需要 `sleep(2)` 或 `retry(3)` 才能穩定，這個測試本身就在掩蓋問題，而不是在發現問題。

**處置原則：** Flaky 的測試要麼修好它，要麼刪掉它，不要讓它繼續活在 CI 裡。

---

### 5. 用來「證明品質」的表演性測試

這是最危險的反模式：自動化的目的不是發現問題，而是給管理層看一個高覆蓋率的數字。

測試覆蓋率（Code Coverage）是個容易被誤解的指標。你可以輕易寫出 90% 覆蓋率但完全沒有斷言的測試：

```python
def test_checkout():
    cart = Cart()
    cart.add_item("item_1", price=100)
    cart.checkout()
    # 沒有 assert，但覆蓋率 100%
```

Brian Marick（敏捷宣言作者之一）早在 2003 年就指出：「Coverage is a tool for finding untested code, not a goal in itself.」（覆蓋率是用來找出沒測試到的地方，不是目標本身。）

---

## 那什麼情況「最值得」自動化？

反過來看：

| 高 ROI | 低 ROI |
|--------|--------|
| 回歸測試（穩定功能） | 探索性驗證（新功能）|
| 核心業務流程（金流、登入）| 視覺細節 |
| API 合約測試 | 一次性驗證 |
| 資料驗算邏輯 | 第三方服務整合（難以模擬）|
| 邊界值、大量組合情境 | 需要人類判斷的使用體驗 |

---

## 自動化的決策框架

下次考慮要不要寫自動化測試前，問自己三個問題：

1. **這個行為未來還會重複出現嗎？** 如果只測一次，直接手動。
2. **判斷標準是機器能理解的嗎？** 如果需要「感覺」或「美感」，人工測試。
3. **這個測試穩定嗎？** 如果環境不穩定，先解決環境問題，再談自動化。

自動化不是越多越好，是越精準越好。一套 200 個穩定、精準的測試，遠勝於 2000 個 flaky、沒有斷言的測試。

---

## 結語

「該不該自動化」是一個 ROI 的問題，不是技術能力的問題。

能寫出自動化是基本功，知道什麼時候不該寫才是判斷力。好的 QA 不是把所有東西都自動化，而是把有限的時間和注意力，放在最能保護系統品質的地方。

---

**延伸閱讀：**
- Lisa Crispin, Janet Gregory — *Agile Testing* (2009)
- James Bach — [Exploratory Testing Explained](https://www.satisfice.com/download/exploratory-testing-explained)
- Google Testing Blog — [Flaky Tests at Google and How We Mitigate Them](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html) (2016)
- Capers Jones — *Applied Software Measurement* (2008)

---

## 參考資料

- [Martin Fowler — Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html) — flaky test 的成因與解決策略
- [Google Testing Blog — Flaky Tests at Google](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html) — Google 處理不穩定測試的實際做法
- [Lisa Crispin — When to Not Automate](https://lisacrispin.com/2011/11/20/using-the-agile-testing-quadrants/) — Agile Testing Quadrants 幫助判斷自動化邊界
- [ISTQB — Test Automation Engineer](https://www.istqb.org/certifications/test-automation-engineer) — 測試自動化工程師認證的自動化範圍判斷準則
- [Ministry of Testing — Automation in Testing](https://www.ministryoftesting.com/articles/automation-in-testing-a-practical-guide) — 自動化實務指南，含不適合自動化的情境
