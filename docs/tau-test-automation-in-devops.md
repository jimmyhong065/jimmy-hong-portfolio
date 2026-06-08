---
tags: ['DevOps', 'CI/CD', '測試策略', 'Pipeline', 'TAU 課程筆記', 'QA 學習']
---

# CI 過了不代表沒問題：DevOps 時代的測試策略全貌

很多團隊導入 CI/CD 之後，會出現一個誤解：

「有 pipeline 了，測試就交給 CI 跑就好。」

然後某天 CI 全綠，release 出去，production 炸了。

這篇是我上完 Test Automation University 上 *Test Automation in DevOps* 的筆記，作者是 *Agile Testing* 的共同作者 Janet Gregory。課程不是在教工具語法，而是在談**測試在 DevOps 流程裡的真正定位**。

---

## 課程概覽

**課程名稱**：Test Automation in DevOps
**平台**：Test Automation University（免費）
**章節**：6 章

---

## DevOps 的核心：測試不是最後一關

課程一開始就說了一句讓我印象深刻的話：

> 「Testing really is the heart of DevOps.」

這不是說 QA 最重要，而是說：DevOps 的本質是「持續交付有信心的軟體」，而信心來自測試。

DevOps 打破的不只是 Dev 和 Ops 的邊界，也打破了「測試是 QA 部門的事」這個觀念。State of DevOps 調查年年發現：**讓開發者和測試人員共同建立可靠的自動化測試**，是高效能團隊最顯著的特徵之一。

---

## Pipeline 是什麼？你真的理解嗎？

很多人以為 pipeline 就是「跑測試的地方」。課程的定義更廣：

**Pipeline 是把程式碼變成 Production 的所有步驟的總和**，包含自動化的和手動的。

課程特別強調一點我以前沒想過：**探索性測試（Exploratory Testing）也是 Pipeline 的一個 Stage。**

一個完整的 CI/CD pipeline 可能長這樣：

```
Commit → 程式碼分析 → Unit Test → 部署到測試環境
     → 自動化驗收測試 → 探索性測試（手動）→ 部署到 Staging
     → 效能測試 / 安全測試 → 部署到 Production
```

**Pipeline 的設計原則：每個 Stage 要為某個人提供有價值的資訊。**

問題清單：
- 這個 Stage 的測試結果誰需要知道？
- 失敗了誰會被通知？怎麼通知？
- 從 commit 到收到反饋，要多久？
- 有沒有辦法讓兩個 Stage 並行執行？

---

## 你的 Pipeline 有「警示疲勞」問題嗎？

課程分享了一個真實故事，讓我覺得很真實。

作者所在的團隊把 CI 狀態顯示在辦公室大螢幕上——失敗就變紅。但因為大家都在低頭工作，沒人注意到紅燈，結果 deploy 失敗了幾個小時才有人發現。

他們的解法很極端：**把一個閃燈的警車燈接到 Production Deploy Pipeline**，測試失敗就開始閃，直到有人「認領」這個問題並負責追蹤修復。

這個實驗奏效了。

重點不是閃燈——重點是：**測試失敗必須是整個團隊的問題，不是 QA 一個人的問題。**

---

## 測試策略：從哪裡開始？

### 還沒有任何自動化測試的團隊

課程的建議非常實際：

> 「先問業務 stakeholder：哪些功能是絕對不能壞的？」

從最關鍵、最有價值的地方開始——不需要一開始就完整，先把第一個測試加進 pipeline，讓下一個人有樣本可以跟。

**UI Smoke Test 可以先填補空缺**，讓你在慢慢建立 unit test 能力的同時，不要完全裸奔。

### 有大量 Legacy Code 的團隊

課程介紹了「Strangler 模式」：

- 新功能一律在新架構上開發（新架構要設計得容易自動化測試）
- 舊的 code 保持不動，只做 refactor，不改邏輯
- 用 bridge 連接新舊架構，隨著時間讓舊 code 被取代

這個策略的好處是：你不需要一次性把所有遺留測試補完，而是隨著新功能的開發自然增加覆蓋。

### 從哪一層開始自動化？

測試金字塔的原則依然適用：**能在低層測的，就不要拉到高層**。

每個測試都應該最小化它需要穿越的應用程式層數。一個驗證計算邏輯的測試，不需要啟動整個 UI 才能跑。

---

## 基礎設施：雲端和容器讓測試飛起來

這一章講了一個讓我很驚訝的案例。

Blackboard（教育科技公司）的 UI 測試套件，原本要跑超過一小時：
- 用雲端基礎設施一年後，縮短到 **16 分鐘**
- 再一個月後，縮短到 **39 秒**

怎麼做到的？**把每個 UI 測試放在獨立的 container 裡並行執行**，整個 suite 的時間就只有最慢那個測試的時間。

現在的雲端和容器工具（Docker、Kubernetes、AWS Lambda）讓這件事已經不再是大公司的特權，成本也很合理。

**Infrastructure as Code（IaC）** 的重要性也被強調：用 Terraform 這類工具管理測試環境，讓環境可以版本控制、可以快速重建、不容易因人員更換而「神秘失去使用方式」。

State of DevOps 調查顯示：使用 IaC 的團隊，成為高效能團隊的機率高出 1.8 倍。

---

## Blue-Green Deployment：讓 Release 不再驚心動魄

課程介紹了一個我覺得 QA 應該都要知道的部署策略。

**Blue-Green Deployment**：同時維護兩個 production 環境（藍 / 綠），只有一個對外。

```
用戶流量 → [DNS Router] → 藍色伺服器（目前 Live）
                        ↘ 綠色伺服器（閒置，只有團隊能存取）
```

流程：
1. 把新版本部署到閒置的綠色伺服器
2. 在綠色伺服器上做測試，確認沒問題
3. 切換 DNS，讓用戶流量指向綠色
4. 萬一出問題，立刻切回藍色

這讓 rollback 從「修 code 再 deploy」變成「切一個 DNS 開關」，幾秒鐘的事。

---

## Production 也需要測試

這是這門課讓我最改觀的一個章節。

課程說：**自動化回歸測試不只是給測試環境用的，Production 也可以跑。**

前提是：
- 測試不能影響真實用戶
- 透過 Feature Toggle 把還沒完成的功能隱藏起來

### 監控、Logging、Tracing 是 QA 的新工具

| 工具 | 用途 |
|------|------|
| **Black Box Monitoring** | 從外部觀察系統狀態（是否在線、回應時間） |
| **Logging** | 記錄每個事件的詳細資料，用來排查問題 |
| **Tracing** | 追蹤單一請求的完整路徑，找出瓶頸 |
| **Metrics** | 數字化的時間序列資料，最便宜、最容易入門 |
| **Observability** | 讓你能問任意問題，即使你不知道問題在哪裡 |

課程引用了一個很精闢的對比：

- **Monitoring** = 你事先設定警報，當你認為可能出問題的事發生了，通知你
- **Observability** = 問題發生了，不管你有沒有預期，你都能快速找到根因

### Chaos Engineering：主動去找未知的問題

Netflix 的 Chaos Monkey 是這個領域的先驅——隨機在 production 環境製造故障，看系統能不能自動恢復。

課程引用了 Sarah Wells 的更嚴謹版本：**有假設、有計畫、有評估的實驗**，不是隨機破壞。

> 「Chaos Engineering is a form of exploratory testing.」

QA 的探索性思維，在 Chaos Engineering 裡完全適用。

---

## 讓整個團隊投入：文化比工具更難

課程的最後一章講的不是技術，而是文化。

State of DevOps 調查找到了一個讓我覺得很重要的現象：

**Medium Performer 的團隊會開始堆積技術債**，然後卡在那個層次，很難再往上成為 High Performer。

原因是：他們在自動化有一點成果後，就停止了。沒有持續把 manual testing 納入、沒有管理測試技術債、沒有改善 pipeline。

課程的建議：

**Three Amigos**（開發 + 測試 + PM）在功能開始前一起對齊需求，用 Example Mapping 把業務規則和測試案例一起定義清楚，再加上 BDD 或 ATDD，就能讓「自動化測試和功能開發同步完成」真正發生。

最後，課程引用了一個 Google 的研究：

> 「心理安全感（Psychological Safety）——相信自己不會因為犯錯而被懲罰——是所有高效能團隊共同的特徵。」

我們需要一個讓人敢說「這個測試失敗了，我不知道為什麼」的環境，而不是把失敗隱藏起來直到上線才爆發。

---

## 我的總結

這門課最讓我改變思維的是：

**Pipeline 是整個交付流程，不只是自動化測試。** 探索性測試、安全測試、效能測試，都是 Pipeline 的一部分，只是有些是手動的。

**Observability 是 QA 在 DevOps 時代的新能力。** 不只是把 bug 找出來，而是在 Production 發生問題時，能用 log、trace、metrics 快速定位根因——這些技能 QA 完全可以掌握，甚至因為探索性思維而特別擅長。

**高效能團隊不是因為工具好，而是因為文化好。** 工具只是支撐，文化是基礎——包括心理安全感、跨角色協作、持續改善的習慣。

---

課程連結：[TAU - Test Automation in DevOps](https://testautomationu.applitools.com/test-automation-in-devops/)
