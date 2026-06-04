# 探索測試怎麼說清楚「我測了什麼」？SBTM 完整指南

---

## 目錄

1. [「你到底測了什麼？」探索測試的最大痛點](#探索測試的最大痛點)
2. [SBTM 是什麼](#sbtm-是什麼)
3. [Charter：每個 session 的任務書](#charter每個-session-的任務書)
4. [Session：60–90 分鐘不被打擾](#session6090-分鐘不被打擾)
5. [Session Report + PROOF Debrief](#session-report--proof-debrief)
6. [完整跑一個 SBTM 的範例](#完整跑一個-sbtm-的範例)
7. [什麼情況最適合用 SBTM](#什麼情況最適合用-sbtm)

---

## 「你到底測了什麼？」探索測試的最大痛點

每個做手動測試的人都遇過這個對話：

> 主管：「這個功能測過了嗎？」
> 測試：「有，我探索測試過了。」
> 主管：「你測了哪些情況？」
> 測試：「呃……我大概點了一遍，試了幾個邊界值……」

這個對話讓探索測試在很多組織裡被認為是「不嚴謹的」。不是因為探索測試本身有問題，而是它缺少一個結構，讓你能說清楚：測了什麼、沒測什麼、發現了什麼。

SBTM（Session-Based Test Management）在 2000 年就解決了這個問題。

---

## SBTM 是什麼

> **定義：** Session-Based Test Management（SBTM）是一套結構化的探索測試管理框架，由 Jonathan Bach 和 James Bach 於 2000 年開發，核心是把探索測試拆分成一個個有邊界的「session」，每個 session 都有明確的任務、時間限制、和紀錄。

SBTM 解決的不是「怎麼測試」，而是「怎麼管理探索測試的過程」。

傳統測試用 test case 作為工作單位，每個 case 有步驟和預期結果，可以打勾。探索測試沒有這個東西——它的價值在於自由探索，找出 test case 預想不到的問題。SBTM 不是要把探索測試變成腳本，而是在保留自由度的同時，加入可追蹤的結構。

**三個核心組成：**

| 元素 | 說明 |
|------|------|
| **Charter** | 這個 session 要探索什麼（任務書） |
| **Session** | 一段不被打擾的探索時間（60–90 分鐘） |
| **Debrief** | 結束後的短暫回顧（15–20 分鐘） |

---

## Charter：每個 Session 的任務書

Charter 是 SBTM 的起點。它不是詳細的測試步驟，而是一句話描述這個 session 的**任務方向**。

**Charter 的格式：**
```
探索 [功能區塊] 使用 [測試手法或情境]
以便 [發現目標 / 確認某件事]
```

**範例：**

| Charter | 說明 |
|---------|------|
| 探索密碼重設流程，使用過期 token，以便了解系統如何處理異常狀態 | 針對特定功能的異常路徑 |
| 探索購物車頁面，以新舊帳號交替操作，以便確認 session 資料不互相污染 | 多帳號/多 session 場景 |
| 探索 API 回傳錯誤碼，使用不同的無效輸入，以便找出缺少 graceful error 的端點 | API 層的防禦性測試 |
| 探索 AI 生成推薦功能，使用邊緣用戶行為，以便發現業務邏輯異常 | 結合 [AI code 測試觀念](/blog/testing-ai-generated-code) |

**寫 charter 的原則：**
- 一個 charter 對應一個 session，不要寫太大
- 聚焦在「探索什麼」，不要規定「怎麼探索」
- 允許測試過程中偏離 charter，但要記錄

---

## Session：60–90 分鐘不被打擾

Session 是真正執行測試的時間。SBTM 對 session 有一個強烈的要求：**不被打擾**。

這不是奢侈的要求，是有原因的：探索測試需要思路連貫。當你正在追蹤一個奇怪的行為，被一封 Slack 訊息或一個會議打斷，你的測試上下文就丟失了。

**Session 的時間分配（90 分鐘為例）：**

| 活動 | 時間 | 比例 |
|------|------|------|
| 測試執行 | ~63 分鐘 | 70% |
| 紀錄 Bug 和觀察 | ~18 分鐘 | 20% |
| 設定環境/其他 | ~9 分鐘 | 10% |

**Session 中要紀錄的東西：**
- 測了什麼（coverage notes）
- 發現的問題（bugs）
- 奇怪的行為（issues，不確定是不是 bug）
- 測試過程中冒出來的新想法（future charters）

不需要即時寫詳細報告，流水帳式的筆記就夠，session 結束後整理。

---

## Session Report + PROOF Debrief

### Session Report

Session 結束後，填寫一份簡短的 session report：

```
Charter:     探索密碼重設流程，使用過期 token
測試者:      Jimmy
日期/時長:   2026-06-04 / 80 分鐘

Coverage:
  - 密碼重設 email 觸發
  - token 在 5 分鐘內使用（正常路徑）
  - token 在 24 小時後使用（預期失敗）
  - 同一 token 使用兩次
  - 多個未使用的 token 同時存在

Bugs:
  - [BUG-142] 過期 token 回傳 500，應為 400/401
  - [BUG-143] 第二次使用 token 無錯誤訊息，靜默失敗

Issues（待確認）:
  - 多個有效 token 同時存在是設計允許的嗎？

Future Charters:
  - 探索跨裝置的 token 行為
```

### PROOF Debrief

PROOF 是 Jonathan Bach 設計的 debrief 框架，引導 tester 和 lead 在 session 結束後做 15–20 分鐘的對話：

| 字母 | 問題 |
|------|------|
| **P**ast | session 裡發生了什麼？ |
| **R**esults | 達成了什麼？找到了什麼？ |
| **O**bstacles | 什麼阻礙了測試？（環境問題、文件缺失、功能未完成） |
| **O**utlook | 還有什麼沒測到？下一步是什麼？ |
| **F**eelings | 測試者對整體狀況有什麼感覺？ |

最後一項「Feelings」看起來軟，實際上是重要的信號。一個有經驗的測試者說「這塊讓我不安心，感覺還有東西沒找到」，比任何指標都有價值。

---

## 完整跑一個 SBTM 的範例

以「新版結帳流程上線前的探索測試」為例：

**步驟 1：產生 charters（測試前）**

```
Charter 1: 探索信用卡付款流程，使用各種卡號格式（合法/非法/邊界），
           以便確認 validation 行為
Charter 2: 探索訂單確認 email，以不同收件地址格式，
           以便確認 email 觸發和內容正確性
Charter 3: 探索結帳流程，以網路中斷場景，
           以便確認 fallback 和資料一致性
Charter 4: 探索促銷碼邏輯，使用已過期/多個/組合碼，
           以便確認邊界和異常處理
```

**步驟 2：排進時程**

| 時間 | Session | 測試者 |
|------|---------|--------|
| 週一 14:00–15:30 | Charter 1 + 2 | A |
| 週一 14:00–15:30 | Charter 3 | B |
| 週二 10:00–11:30 | Charter 4 | A |

**步驟 3：執行 + 紀錄**

每個 session 填 session report，PROOF debrief 在 session 結束後立刻進行。

**步驟 4：整合結果**

把所有 session reports 整合成一份探索測試摘要：
- 覆蓋了哪些 charter
- 總共找到幾個 bug（依嚴重程度分類）
- 還有哪些 charter 沒跑到（明確標示未覆蓋的風險）

這份摘要是你向主管說明「我們的探索測試覆蓋了什麼」的依據。

---

## 什麼情況最適合用 SBTM

SBTM 不是每種情境都適合，以下幾個情境效果最明顯：

**最適合：**
- **新功能上線前**：沒有完整 spec，需要探索式地找邊界
- **複雜業務邏輯**：規則多、例外多、難以窮舉 test case
- **舊系統改動**：不確定改動的影響範圍
- **AI 功能測試**：AI 的輸出難以用 test case 窮舉，探索測試特別有效

**效果較有限：**
- 純粹的回歸測試（直接跑自動化即可）
- 有完整規格、步驟明確的功能驗收

---

## 為什麼 2026 年 SBTM 比以前更重要

70% 以上的 critical bug 仍然靠手動/探索測試找到（2025 年調查）。AI 在接管回歸測試——這件事讓手動測試員有更多時間做探索，但同時也讓「你探索了什麼、找到了什麼」的可視性變得更重要。

沒有 SBTM 的探索測試，在自動化覆蓋率越來越高的環境裡，會越來越難說明自己的價值。

有了 SBTM，你的每個 session 都是一份有記錄的貢獻——charter 說明了測試方向，report 說明了結果，debrief 說明了下一步。這不只是方法論，是你在 AI 工具越來越多的時代保持不可取代的方式。

---

*參考資料：*
- *[Session-Based Test Management - James Bach, Satisfice Inc.](https://www.satisfice.com/download/session-based-test-management)*
- *[A Journey in Test Engineering Leadership: Applying SBTM - InfoQ](https://www.infoq.com/articles/session-based-test-management/)*
- *[Session Based Test Management - Ministry of Testing](https://www.ministryoftesting.com/software-testing-glossary/session-based-test-management-sbtm)*
- *[Why Manual Testing Is Still Essential in 2026 - QASource](https://www.qasource.com/blog/why-do-we-still-need-manual-testing)*
