# Flaky Test 吃掉 40% 工時：Self-healing 自動化真的能解決嗎

---

## 目錄

1. [Flaky Test 的真正成本](#真正成本)
2. [大家以為是 locator 的問題，其實不是](#不是-locator-問題)
3. [六種 Flaky Test 的根源與解法](#六種根源)
4. [Self-healing 工具怎麼運作](#怎麼運作)
5. [Self-healing 的限制：會掩蓋真正的 bug](#限制)
6. [不靠工具，自己能做的事](#自己能做)
7. [該怎麼選擇](#怎麼選擇)

---

## Flaky Test 的真正成本

有一個數字讓很多人驚訝：維護成熟的自動化測試套件，有 **40–60% 的 QA 工程師時間花在修壞掉的測試上**，而不是在抓真正的 bug。

這不是誇大。每次 UI 改一點、API 回應慢了一些、測試環境抽風、session token 過期，都可能讓測試失敗。失敗的測試要調查、要修、要確認不是真的 bug——這些事加起來，就是大部分自動化工程師的日常。

Flaky test 最可怕的地方不只是浪費時間，是**讓人開始不信任測試結果**。跑了一堆測試，紅的不一定是真的壞，綠的不一定是真的好。這時候自動化失去了它最核心的價值：快速、可靠地告訴你系統狀態。

---

## 大家以為是 locator 的問題，其實不是

提到 flaky test，大多數人第一個想到的是「locator 又壞了」——XPath 寫死了、元素 ID 改了、UI 層級換了。

但實際上 locator 問題只佔所有 flaky test 失敗原因的 **約 28%**。

真正的分布長這樣：

| 失敗原因 | 比例 |
|---------|------|
| Timing 問題（非同步等待）| ~30% |
| Locator 問題（元素找不到）| ~28% |
| Test data 問題（session 過期、資料無效）| ~14% |
| Visual assertion 問題（畫面差異）| ~10% |
| Interaction 問題（元素被遮住）| ~10% |
| Runtime error（環境崩潰）| ~8% |

Timing 問題才是最大宗——你的測試去點一個按鈕，但 API 還沒回來、動畫還沒跑完、資料還沒載入。

這意味著：如果你的 self-healing 工具只會修 locator，它頂多能解決 28% 的問題，其他 72% 的 flaky test 它幫不上忙。

---

## 六種 Flaky Test 的根源與解法

**1. Timing 問題（~30%）**

根源：非同步操作、API 延遲、動畫、頁面過場

解法：
- 用 explicit wait 等特定條件，不要用 `sleep(3)`
- 等「元素可以互動」而不是「元素存在」
- Maestro 的內建等待邏輯可以幫你處理大部分這類問題

**2. Locator 問題（~28%）**

根源：UI 改版、元素屬性變更、layout 層級調整

解法：
- 優先用 **Accessibility ID**（最穩定，不依賴 UI 結構）
- 避免用 XPath index（`//android.widget.TextView[3]` 這種最脆）
- 有 accessibility label 的元素，locator 跟 UI 改版解耦

**3. Test data 問題（~14%）**

根源：Session token 過期、測試帳號被用過的資料污染、環境資料不乾淨

解法：
- 每個測試前重新登入，不要共用 session state
- 測試用的帳號跟資料要可以重置
- 用 API 直接建立測試資料，不要依賴 UI 操作去設定前置條件

**4. Visual assertion 問題（~10%）**

根源：字型 rendering 差異、截圖解析度不同、動畫截到中間狀態

解法：
- Visual regression 不要用像素完全比對，用容許範圍（threshold）
- 截圖前等動畫完全結束
- 同裝置、同解析度的截圖才有意義比對

**5. Interaction 問題（~10%）**

根源：元素被 keyboard、toast、overlay 擋住

解法：
- 點選前先收 keyboard
- 等 overlay/toast 消失再繼續
- 必要時先 scroll 讓目標元素完全進入可視區

**6. Runtime error（~8%）**

根源：服務掛掉、emulator 當掉、CI 環境問題

解法：
- CI 環境加健康檢查（Appium server 有沒有起來、emulator 有沒有連上）
- 跑前驗證環境狀態，而不是跑到一半才發現壞了

---

## Self-healing 工具怎麼運作

Self-healing 測試工具（Testsigma、Katalon 的 self-healing、Healenium 等）大致上都在做同一件事：

**測試失敗時，工具先診斷失敗原因，然後自動修復，再繼續跑。**

例如：

- 找不到元素 → 用 AI 比對 DOM 結構，找最相似的元素 → 更新 locator → 繼續
- API 太慢 → 偵測到 timing 問題 → 加上等待重試 → 繼續
- Session 過期 → 偵測到 401 → 重新走登入流程 → 繼續

好的 self-healing 工具會記錄「修了什麼」，讓你事後審查，確認它修的方向是對的。

### 2026 的新一代：Runtime Locator Repair

2026 年的 self-healing 工具已不只是「找不到元素才修」，而是 **runtime 就主動修，修完自動 propagate 到所有引用這個元素的測試**。

代表工具：

| 工具 | 機制 | 數據 |
|------|------|------|
| **Drizz** | Vision AI：不用 selector，直接看螢幕找元素 | flakiness ~5% vs 傳統 Appium ~15% |
| **ContextQA** | Runtime 偵測 locator 變化 → 產生候選修復，依信心分數排序 → 自動套用到所有測試 | — |
| **BrowserStack App Automate** | 自動分析 log/video/stack trace，分類失敗原因並給修復建議 | 除錯時間減少 95% |

**Vision AI** 是其中最根本的突破：Drizz 等工具完全不寫 selector，測試指令用自然語言（「點擊登入按鈕」），工具用視覺模型辨識螢幕上的元素，跟人眼一樣。UI 改版、元素 ID 變了、按鈕位置移了——只要畫面上還看得到那個元素，測試就不會 break。

這代表 locator 問題（~28%）有機會被徹底解決，而不只是事後修補。

---

## Self-healing 的限制：會掩蓋真正的 bug

這是 self-healing 最大的陷阱，很多人沒有意識到：

**如果 locator 壞了是因為 UI 真的改了，self-healing 自動更新 locator 繼續跑——但你失去了一個機會發現「這個改版是不是預期的？」**

更危險的是：有時候 locator「找不到」是因為那個 UI 元素真的不存在了（功能壞掉），而不是 locator 過時了。Self-healing 把它當成 locator 問題修掉，測試繼續跑並且通過，但實際上功能壞掉了。

這就是**測試通過但 bug 存在**的情境——比 flaky test 更糟糕。

所以 self-healing 要搭配：
1. 每次修復都要有 audit log
2. 定期 review 被自動修復的記錄
3. 高風險的關鍵流程，不要完全依賴 self-healing

---

## 不靠工具，自己能做的事

不是每個團隊都需要買 self-healing 工具。先把基礎做好，很多 flaky test 就消失了：

**寫好 locator 策略**
- 優先順序：Accessibility ID > Resource ID > Content Desc > XPath
- 絕對不用 XPath index

**消滅 `sleep`，改用明確的等待條件**
```python
# 不要這樣
time.sleep(3)
driver.find_element(...)

# 要這樣
WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((AppiumBy.ID, "btn_login"))
)
```

**每個測試獨立，不共用狀態**

測試 A 的結果不能影響測試 B 的前置條件。每個測試前重置到已知狀態。

**在 CI 加環境健康檢查**

跑測試前先確認 Appium server 活著、emulator 連線正常，而不是跑到一半才發現環境壞了。

---

## 該怎麼選擇

```
你的 flaky rate 主要來自哪裡？
├── locator 一直壞 → 考慮 self-healing 工具（Katalon / Testsigma）
├── timing 問題 → 考慮 Maestro（內建等待邏輯）或優化 explicit wait
├── test data 問題 → 架構問題，工具解不了，要改測試設計
└── 環境問題 → 投資在 CI 穩定度，不是買新工具
```

Self-healing 工具可以幫你省時間，但它是在幫你「快速修好破掉的傘」，不是幫你「停止雨的下法」。

真正讓 flaky test 減少的，是寫出更穩定的測試，而不是靠工具在背後自動縫縫補補。

---

*參考資料：[The 6 Types of AI Self-Healing in Test Automation - QA Wolf](https://www.qawolf.com/blog/self-healing-test-automation-types) ／ [AI Augmented Testing for Flaky Test Detection - Kobiton](https://kobiton.com/guides/ai-augmented-testing-flaky-test-detection-mobile-apps/) ／ [5 Best Self-Healing Mobile Test Automation Tools 2026 - Drizz](https://www.drizz.dev/discover/self-healing-mobile-test-automation-tools)*
