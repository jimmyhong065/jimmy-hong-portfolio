# 不用寫 Selector 的 App 測試：Vision AI 測試是什麼？

---

## 目錄

1. [Selector 的問題：不是你寫得不夠好](#selector-的問題不是你寫得不夠好)
2. [Vision AI 測試是什麼](#vision-ai-測試是什麼)
3. [技術原理：怎麼「看」螢幕](#技術原理怎麼看螢幕)
4. [數字對比：Vision AI vs 傳統 Appium](#數字對比)
5. [哪些情境最適合、哪些還有限制](#哪些情境最適合)
6. [現在能怎麼用](#現在能怎麼用)

---

## Selector 的問題：不是你寫得不夠好

你有沒有遇過這個情況：

前端工程師改了一個按鈕的 `resource-id`——從 `btn_login` 改成 `login_button`。你的測試全部紅掉。花了一個小時更新所有 locator，在 code review 被問「這個 PR 改了什麼業務邏輯？」，答案是：什麼都沒改，只是修壞掉的 selector。

這個問題不是你的 locator 策略不夠好。是 selector-based 測試的**結構性弱點**：

**你的測試依賴的是 app 的內部結構（accessibility tree），而不是使用者看到的畫面。**

每次 OS 升版、UI 重構、元素 ID 調整，accessibility tree 就可能變。你的測試跟著壞。這就是為什麼成熟的自動化測試套件，有 [40–60% 的 QA 工時花在修壞掉的測試](/blog/flaky-test-self-healing)，而不是抓真正的 bug。

Vision AI 測試從根本換掉這個假設。

---

## Vision AI 測試是什麼

> **定義：** Vision AI 測試（Vision AI Mobile Testing）是一種不依賴 selector 或 accessibility tree 的測試方式，工具透過電腦視覺和語言模型直接分析螢幕畫面，辨識元素的外觀和語義，再執行操作——跟人眼看螢幕的方式相同。

傳統測試：
```
測試腳本 → accessibility tree → 找到元素 ID → 執行操作
```

Vision AI 測試：
```
測試指令（自然語言）→ 截圖 → 視覺模型辨識 → 執行操作
```

用自然語言寫測試：
```
# 傳統 Appium
driver.find_element(AppiumBy.ID, "btn_login").click()

# Vision AI（Drizz）
- tapOn: "登入"
```

當按鈕的 `resource-id` 改了，傳統測試壞掉；Vision AI 測試繼續跑，因為它認識的是「那個寫著『登入』的按鈕」，而不是「那個 ID 叫 btn_login 的元素」。

---

## 技術原理：怎麼「看」螢幕

Vision AI 測試工具的執行流程：

```mermaid
flowchart LR
    A[自然語言指令 點擊登入按鈕] --> B[截圖]
    B --> C[VLM 分析 辨識所有可見元素]
    C --> D[語意比對 找到最符合的元素]
    D --> E[執行操作 點擊座標]
    style A fill:#dbeafe,stroke:#3b82f6
    style E fill:#dcfce7,stroke:#22c55e
```

核心技術是 **VLM（Vision-Language Model）**——同時理解視覺和語言的 AI 模型。它做兩件事：

1. **看**：辨識螢幕上所有可見的元素（按鈕、文字、輸入框、圖示），以及它們的位置
2. **理解**：把自然語言指令（「點擊登入按鈕」）跟畫面上的元素做語意比對

整個過程不碰 accessibility tree，不需要元素 ID，不需要 XPath。畫面上看得到就能找到。

**效能：** 目前的 VLM 做 UI 元素辨識，準確率 90% 以上，inference latency 在 100ms 以內，對測試執行速度的影響不大。

---

## 數字對比：Vision AI vs 傳統 Appium {#數字對比}

根據 Drizz 2026 年的數據（使用真實裝置跑 CI）：

| 指標 | Vision AI（Drizz） | 傳統 Appium |
|------|-------------------|------------|
| Flakiness rate | **~5%** | ~15% |
| CI 成功率 | **97%+** | 視維護狀態而定 |
| 每位工程師每月可寫測試數 | **200+** | ~15 |
| UI 改版後需要修測試 | 通常不需要 | 每次都需要 |
| 上手門檻 | 低（自然語言） | 高（Appium API、locator 策略） |

15 vs 200：這個差距不只是寫法不同，是整個維護成本的思維轉變。Appium 需要工程師深度投入才能維持測試健康度；Vision AI 工具讓測試稿寫起來更像「描述行為」，而不是「操作程式碼」。

---

## 哪些情境最適合、哪些還有限制 {#哪些情境最適合}

**最適合：**

| 情境 | 原因 |
|------|------|
| UI 頻繁改版的 app | locator 不斷壞、維護成本高，Vision AI 天然免疫 |
| E2E smoke test | 覆蓋主要流程，不需要精準的斷言邏輯 |
| 跨 OS 版本驗證 | 不依賴 accessibility tree，OS 升版影響小 |
| 非工程師撰寫測試 | 自然語言指令，不需要寫程式 |
| OTP / 動態內容 | 傳統 selector 抓不到隨機產生的值，Vision AI 從畫面讀 |

**目前的限制：**

- **複雜斷言**：確認特定數值、驗證計算結果等，需要搭配傳統方法
- **不可見的狀態**：API 層的正確性、後端資料驗證，不是視覺能判斷的
- **效能測試**：Vision AI 不適合量測回應時間、壓力測試
- **成本**：每次截圖 + VLM 推論有費用，大規模跑可能比 Appium 貴

---

## 現在能怎麼用

2026 年可用的 Vision AI 測試工具：

| 工具 | 定位 | 特點 |
|------|------|------|
| **Drizz** | Vision AI 原生，iOS/Android | 自然語言指令、真實裝置、CI 整合 |
| **Maestro** | YAML-based，偏輕量 | 不是 Vision AI 但低 flakiness，入門快 |
| **ContextQA** | AI self-healing + mobile | Runtime locator repair，修復自動 propagate |

如果你的團隊現在深度用 Appium，不需要馬上換工具。可以先：

1. **新功能的 smoke test** 用 Vision AI 工具寫，跟既有 Appium 套件並行
2. **觀察維護成本差異**：哪邊 UI 改版後修起來比較快
3. **決定是否逐步遷移**

完整的工具選擇決策樹，可以參考 [Flaky Test 那篇](/blog/flaky-test-self-healing)裡的選擇框架——根本問題是 locator 還是 timing，不同根源對應不同的解法。

---

## 小結

Selector-based 測試的脆弱不是工程師的問題，是架構的問題。Vision AI 測試換掉的是一個假設：「測試應該依賴 app 的內部結構」→「測試應該依賴使用者看到的畫面」。

這個轉換讓 UI 改版從「需要修測試」變成「不需要」。在 app 疊代快、UI 頻繁調整的環境下，這個差距會越來越大。

---

*參考資料：*
- *[What is Vision AI Mobile Testing? - Drizz](https://www.drizz.dev/post/what-is-vision-ai-mobile-testing)*
- *[11 Mobile Test Automation Tools Compared 2026 - Drizz](https://www.drizz.dev/post/best-mobile-test-automation-tools)*
- *[Mobile Automation Testing 2026: Complete Strategy Guide - ContextQA](https://contextqa.com/blog/mobile-testing-strategy-that-actually-works-2026/)*
