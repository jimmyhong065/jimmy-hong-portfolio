# Hotfix 測試流程：凌晨兩點上線，你有幾分鐘決定能不能發

---

## 目錄

1. [那次跨年活動的 hotfix](#跨年活動的-hotfix)
2. [Hotfix 和正常 release 的測試差異](#差異)
3. [我的 Hotfix 測試 SOP](#sop)
4. [幾個關鍵判斷](#關鍵判斷)
5. [結尾](#結尾)

---

## 那次跨年活動的 hotfix

凌晨 12:05，我們的 App 跨年活動剛開始五分鐘。

PM 的 Slack 訊息：「大量用戶回報計時完成後硬幣沒有入帳，森林也沒有更新。」

RD 五分鐘內找到根本原因：活動的三倍硬幣計算邏輯有一個整數溢位 bug，只在硬幣餘額超過某個數值時觸發。跨年活動前用戶刷了大量硬幣，大部分活躍用戶的餘額都超過了那個閾值。

修復很簡單：一行程式碼。

但問題是：凌晨 12:05，所有人都還在，但大家都有點緊張，有人提議要不要等到明天白天再發 hotfix。

PM 說：「活動只到凌晨一點，等不了。」

我有 15 分鐘決定這個 hotfix 可不可以上線。

---

## Hotfix 和正常 release 的測試差異

DORA 2024 年的研究將「平均恢復時間（MTTR）」定義為衡量軟體交付效能的核心指標之一。Elite 效能團隊的 MTTR 低於 1 小時，而一般團隊則需要 1 天以上。Hotfix 測試的品質，直接決定了這個數字。更重要的是，DORA 的資料也顯示：能夠快速安全地發 hotfix，和日常測試自動化程度高度相關。

正常 release 的測試流程：完整的功能測試 + 回歸測試，通常需要幾天到一週。

Hotfix 的情況：

- 時間極度壓縮（15 分鐘到幾小時）
- 修改範圍很小（通常是一個 bug fix）
- 上線不上線都有風險（不上線：bug 繼續影響用戶；上線：如果 hotfix 有問題，影響更大）

這兩種情況需要完全不同的測試策略。

正常 release 用寬度：儘量覆蓋所有功能和情境。
Hotfix 用深度：快速確認修復的地方是對的，確認沒有引入新的問題。

---

## 我的 Hotfix 測試 SOP

**Phase 1：確認修復（5 分鐘）**

只測修復的那個問題，確認它真的修好了：

1. 重現 bug：用觸發條件（硬幣餘額超過閾值的帳號 + 三倍活動）重現問題
2. 套用 hotfix build：拿到修復後的 build
3. 確認問題消失：同樣的條件，問題不再出現
4. 確認修復的邏輯：看 code diff，確認修改只動了那一個地方，沒有附帶其他改動

**Phase 2：Smoke Test（5 分鐘）**

跑一遍最核心的 5 個功能，確認 hotfix 沒有破壞基本功能：

1. App 正常啟動
2. 登入/登出
3. 計時開始 + 結束
4. 正常帳號（不觸發 bug 條件）的硬幣入帳
5. 森林主頁正常顯示

這 5 個是我平時就維護的 hotfix smoke checklist，不需要當場決定要測什麼。

**Phase 3：風險評估（5 分鐘）**

這不是測試，是決策：

- 這個 hotfix 修改了多少 code？（改了一行和改了 50 行，風險完全不同）
- 被修改的模組還有什麼其他功能依賴它？
- 最壞的情況是什麼？如果這個 hotfix 有問題，影響範圍是？
- 不上線的最壞情況是什麼？bug 繼續的影響範圍是？

把這兩個最壞情況比較，做出決定。

---

## 幾個關鍵判斷

**「改了一行，應該很安全」**

最危險的心態。一行程式碼可以改變很多東西，取決於那一行在哪裡、影響什麼。

每次 hotfix 之前，我都會看 code diff 並問 RD：「這個修改影響到哪些地方？除了這個 bug，還有哪些功能可能受影響？」

**「Staging 測過了，可以上」**

Staging 和 Production 的資料不同。那次跨年活動的 bug 在 staging 測不出來，因為 staging 帳號的硬幣餘額沒有超過那個閾值。

Production 的資料狀態是真實的，有時候 staging 測試無法重現 production 的問題，也無法保證 production 沒有問題。

知道 staging 的局限性，是對 hotfix 風險判斷很重要的一件事。

**Rollback Plan**

上 hotfix 之前，確認好 rollback 怎麼做：

- 如果這個 hotfix 出問題，多快能 rollback？
- Rollback 需要 DB migration 嗎？（如果需要，風險更高）
- Rollback 之後，這段時間的用戶資料怎麼辦？

有清楚的 rollback plan，才能有信心說「出問題我們可以復原」。

---

## Hotfix 之後的事

上線之後，監控 15 分鐘：

- Firebase Crashlytics 的 crash rate 有沒有上升
- API error rate 有沒有上升
- 這個 bug 的觸發情境有沒有繼續出現

如果 15 分鐘內沒有異常，初步確認 hotfix 沒有引入新問題。

事後，在 sprint 回顧時做 post-mortem：

- 這個 bug 為什麼在正常 release 的測試中沒有被發現？
- 什麼條件觸發了這個 bug，未來怎麼測試這類情境？
- 需要加哪些自動化測試來防止 regression？

那次跨年活動之後，我加了一個自動化測試：「硬幣餘額接近整數邊界的帳號，完成計時後硬幣計算是否正確」。這個測試現在在 CI 每次跑。

---

## 結尾

Hotfix 測試考驗的不是你能測多快，是你能在最短的時間內做出最有根據的判斷。

「測完了，可以上」和「測不完，但基於這些確認，風險是可接受的，可以上」是兩回事。後者需要清晰的思路和對風險的量化評估，而不是「感覺應該沒問題」。

凌晨兩點的 hotfix，那 15 分鐘的決定品質，取決於你平時有沒有建好 smoke checklist，有沒有練習過快速風險評估，有沒有確認過 rollback plan。緊急情況不是開始準備的時候，是執行你早就準備好的東西的時候。

---

## 參考資料

- [DORA 2024 研究報告](https://dora.dev/research/2024/dora-report/) — MTTR 與 Hotfix 能力的研究數據
- [Google SRE Book：Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) — Google SRE 對事後回顧（Post-mortem）的文化與流程建議
- [Firebase Crashlytics 文件](https://firebase.google.com/docs/crashlytics) — 上線後監控 crash rate 與錯誤的工具
- [Martin Fowler：Continuous Delivery](https://martinfowler.com/bliki/ContinuousDelivery.html) — 持續交付概念，包含 hotfix 安全發布的思維框架
- [Atlassian：Incident Management Postmortem](https://www.atlassian.com/incident-management/postmortem) — 事件管理與 post-mortem 的實務指南
