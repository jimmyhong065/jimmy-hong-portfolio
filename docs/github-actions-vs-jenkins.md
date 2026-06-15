---
tags: ['CI/CD', 'DevOps', 'GitHub Actions', '測試工具', 'QA 思維']
---

# GitHub Actions vs Jenkins：CI 工具怎麼選

這個問題我在兩個地方看到最多：剛導入 CI/CD 的小團隊在問，和 Jenkins 用了五年開始覺得維護成本太高的大團隊也在問。

兩個工具都能跑測試、自動部署、整合通知——但它們的設計理念完全不同，選錯了會讓你的 CI 成為維護負擔而不是品質守門員。

這篇從 QA 的角度比較兩者，說清楚什麼情況選哪個。

---

## 兩個工具在解決不同的問題

**GitHub Actions** 是 GitHub 內建的 CI/CD 工具，設計目標是「讓 CI 跟著 code 走」。你的 pipeline 就是 repo 裡的一個 YAML 檔，和 code 一起版本控制，和 PR 深度整合。

**Jenkins** 是 2011 年就存在的老牌 CI 工具，設計目標是「什麼都能做」。它是一台自己架的伺服器，透過 1800+ 個 plugin 支援幾乎所有你能想到的流程。

一句話差異：**GitHub Actions 幫你管 infrastructure，Jenkins 讓你自己管。**

---

## GitHub Actions 適合什麼情況？

### repo 在 GitHub 上

這個前提成立，GitHub Actions 幾乎是預設選項。

沒有額外的伺服器要架，沒有網路設定要調，PR 開了自動跑測試、合併了自動部署——整個流程在同一個地方，不需要在兩個系統之間跳來跳去。

### 想快速開始，不想維護 CI 伺服器

GitHub Actions 的 runner（執行環境）是 GitHub 幫你管的雲端機器。你不需要擔心伺服器掛掉、更新、容量不夠——這些都是別人的問題。

開始的成本很低：一個 `.github/workflows/test.yml`，幾行 YAML，測試就跑起來了。

### 中小型團隊，流程不複雜

GitHub Actions 的免費額度對大多數中小型私有 repo 夠用：每月 2000 分鐘（免費方案）。公開 repo 無限免費。

Marketplace 有幾千個現成的 action：setup Python、上傳 artifact、發 Slack 通知——絕大多數常見需求有人寫好了，直接用。

---

## Jenkins 適合什麼情況？

### 需要 on-premise（不能把 code 送上雲端）

金融業、政府機關、部分醫療系統——有些組織的規定是 code 不能離開自己的伺服器。GitHub Actions 的 hosted runner 在 GitHub 的雲端上，這類組織用不了。

Jenkins 自己架在自己的伺服器上，完全在公司控制範圍內。

### 流程非常複雜，需要高度客製化

Jenkins 的 Groovy-based pipeline 支援複雜的條件分支、動態 stage 生成、跨 job 依賴關係。如果你的 pipeline 需要「根據 commit message 決定跑哪些測試」、「不同環境有完全不同的部署邏輯」，Jenkins 的靈活度更高。

GitHub Actions 的 YAML 語法在複雜情境下會開始變得難以維護。

### 已有成熟的 Jenkins 生態

公司已經有 Jenkins 伺服器、已經有人熟悉 Groovy 語法、有整套 shared library——這時候切換到 GitHub Actions 的遷移成本可能遠高於繼續用 Jenkins。

---

## 從 QA 角度，差在哪？

這是大多數比較文章略過的部分。

### 測試報告整合

**GitHub Actions**：沒有內建的測試報告 UI。需要用 action（如 `dorny/test-reporter` 或上傳 artifact）才能在 PR 頁面看到測試結果細節。設定需要一點工，但整合後體驗不錯——失敗的測試案例直接顯示在 PR 頁面。

**Jenkins**：JUnit plugin 是標配，`junit 'reports/**/*.xml'` 一行就能在 build 頁面看到完整的測試報告。Allure Report 也有 plugin，安裝後直接整合。對 QA 來說，Jenkins 的測試報告整合相對更成熟。

### 平行測試執行

**GitHub Actions**：matrix strategy 讓你很容易跑多個組合並行——不同 OS、不同 Python 版本、不同測試分組。設定直觀。

```yaml
strategy:
  matrix:
    test-group: [smoke, regression, api]
```

**Jenkins**：parallel 語法支援動態平行，可以根據測試數量自動切分。更靈活，但設定也更複雜。

### 測試環境管理

**GitHub Actions**：每次 job 都是全新的乾淨環境，不會有「上次跑的 data 影響這次」的問題。對測試來說這是優點——環境隔離幾乎免費。

**Jenkins**：共用同一台 agent，需要自己管理環境清理。如果沒有用 Docker agent，很容易出現測試互相污染的問題。

### 失敗通知

兩者都能接 Slack、email——這塊差不多。GitHub Actions 稍微更簡單（Slack action 直接用），Jenkins 需要裝 plugin。

---

## 怎麼選：一個決策框架

| 條件 | 建議 |
|------|------|
| repo 在 GitHub | GitHub Actions |
| 需要 on-premise | Jenkins |
| 團隊 < 20 人 | GitHub Actions |
| 已有 Jenkins 且運作正常 | 繼續用 Jenkins |
| 從零開始建 CI | GitHub Actions |
| pipeline 邏輯非常複雜 | Jenkins |
| 重視測試報告 UI | Jenkins（原生）或 GitHub Actions（加 plugin） |
| 不想維護 CI 伺服器 | GitHub Actions |

**最簡單的判斷**：如果你現在沒有 Jenkins、repo 在 GitHub、團隊不大——選 GitHub Actions，不要猶豫。Jenkins 的靈活度是優點，但靈活度的代價是維護成本，在你真的需要那個靈活度之前，不值得付這個代價。

---

## 我在實際工作中的選擇

目前用的是 GitHub Actions。

原因很務實：repo 在 GitHub，沒有 on-premise 需求，team 不大。Actions 的 matrix builds 讓 E2E 測試平行跑在三個環境上，從 25 分鐘縮到 9 分鐘。PR 頁面直接看到哪個測試失敗，不用跳到另一個系統。

唯一覺得 Jenkins 比較好的地方是測試報告——Jenkins 的 Allure integration 更完整。但這個差距現在用 `dorny/test-reporter` 已經補得差不多了。

如果有一天公司規定 code 不能出去，或 pipeline 複雜到 YAML 寫不下去，我會重新評估。但在那之前，GitHub Actions 的「少維護、跟著 code 走」的設計，對 QA 來說是真正的省力。

---

## 常見問題

**Q：GitHub Actions 和 Jenkins 可以同時用嗎？**
A：可以。有些團隊用 GitHub Actions 跑 PR 的快速測試（commit check），用 Jenkins 跑完整的夜間回歸測試（regression suite）。兩者不互斥，根據速度和成本需求分工。

**Q：Jenkins 比 GitHub Actions 貴還是便宜？**
A：看情境。GitHub Actions 按分鐘計費，免費額度用完後計費。Jenkins 本身免費，但需要自己的伺服器（硬體或雲端 VM），伺服器成本加上維護人力，中長期不一定便宜。小團隊通常 GitHub Actions 總成本更低；大型 enterprise 跑大量 CI 的情況，自建 Jenkins + self-hosted runner 可能更划算。

**Q：從 Jenkins 遷移到 GitHub Actions 難嗎？**
A：取決於 pipeline 複雜度。簡單的「跑測試、部署」流程一天內可以遷完。複雜的 Groovy shared library、條件分支、跨 job 依賴關係，可能需要數週重新設計。建議先遷移一條簡單 pipeline 試水溫，評估工作量再決定是否全面遷移。

**Q：self-hosted runner 是什麼？什麼時候需要用？**
A：self-hosted runner 是你自己架的機器，但由 GitHub Actions 調度。用途：需要特定硬體（如連接實體 iOS 裝置跑 Appium 測試）、需要存取內網資源、或 hosted runner 的分鐘數不夠用。設定不複雜，但機器要自己維護，介於 hosted runner 和 Jenkins 之間的選項。
