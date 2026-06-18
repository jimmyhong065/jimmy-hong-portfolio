# Slack Command 讓 QA 流程少開三個工具

---

## 目錄

1. [每次操作都要開不同地方](#每次操作)
2. [三個 Command 做了什麼](#三個-command)
3. [/runner-status](#runner-status)
4. [/assign-task](#assign-task)
5. [觸發 E2E 測試](#觸發-e2e)
6. [結尾](#結尾)

---

## 每次操作都要開不同地方

心理學研究顯示，在不同工具或任務之間切換，每次都需要大腦重新建立情境——完全恢復專注平均需要超過 20 分鐘。對 QA 來說，一天裡在 GitHub、Notion、Slack 之間來回切換數十次，表面上只是「點幾下」，實際上消耗的是大量的認知資源和時間。

自動化測試和 CI 建好之後，日常操作分散在不同地方：

- 查 runner 狀態：GitHub Settings → Actions → Runners
- 派工給工讀生：Notion 或 Slack 手打
- 觸發 E2E 測試：GitHub Actions → 找 workflow → 手動 dispatch

每個操作本身不複雜，但加起來就是一直切換視窗、一直找入口。工讀生要觸發測試，還要先確認有沒有 GitHub 權限。

我把這三件事包成 Slack Command，不需要開 GitHub，不需要有 repo 權限，在 Slack 輸入指令就能完成。

---

## 三個 Command 做了什麼

| Command | 用途 |
|---|---|
| `/runner-status` | 查詢所有 runner 狀態 |
| `/assign-task` | 開 modal 派工給工讀生 |
| 其他 command | 開 modal 觸發 E2E 測試 |

---

## /runner-status

輸入後直接回傳 ephemeral 訊息（只有自己看得到），列出每台 runner 的狀態：

- online / offline
- idle / busy
- labels（標記這台 runner 支援哪些測試類型）
- 總計統計：共幾台、online / offline / busy 各幾台

測試開始前先確認 runner 有沒有在線，不用走去 GitHub Settings 確認。runner 掛掉的時候，輸入一個指令就知道，不需要等到測試一直沒有結果才發現。

---

## /assign-task

輸入後開啟 modal「工讀生派工」，欄位包含：

- 指派給（user picker，直接選 Slack 成員）
- 日期（datepicker，預設今天）
- 平台（Android / iOS，checkbox 複選）
- 版本號
- GP APK URL（optional）
- CN APK URL（optional）
- 測試範圍
- 測試文件 URL（optional）
- 備註（optional）

送出後自動 post 訊息到 `#qa-team`，格式是工作項目清單，包含上面填的所有資訊。

過去派工是在 Slack 手打或複製模板，格式不統一，有時候忘記填版本號或平台。改成 modal 之後，必填欄位有驗證，格式固定，頻道裡的派工紀錄也比較容易回溯。

---

## 觸發 E2E 測試

輸入對應的 command 後開啟 modal，欄位包含：

- **env**：prod / staging（動態更新 modal，不同 env 有不同選項）
- **apk_type**：gp / cn（動態更新 modal）
- **version**：測試版本號
- **platform**：iOS / Android
- **device_type**：裝置類型
- **s3_url_download**：APK/IPA 的下載連結
- **old_version / new_version**：升級測試時的版本區間

送出後 trigger GitHub Actions workflow dispatch，並在頻道回報觸發成功或失敗。

幾個使用場景：

**工讀生跑 smoke test**：裝好 APK 後，在 Slack 觸發，不需要申請 GitHub 權限。

**RD 自己觸發**：功能開發完想跑一遍，不需要找 QA 說「可以幫我跑一下嗎」。

**手機觸發**：緊急情況要確認，手機開 Slack 比手機開 GitHub 順很多。

---

## 結尾

把常用操作包成 Slack Command 的邏輯很簡單：找出團隊每週重複做超過幾次的操作，評估能不能包成一個指令。

QA 的工具不只是測試本身，還包括讓測試容易被觸發、讓派工容易被記錄、讓狀態容易被查到。一個讓大家都能用的入口，比一個只有 QA 知道的 CI 介面更有價值。Stack Overflow Developer Survey 2024 顯示，超過 70% 的開發者將「流暢的工具整合」列為提升工作效率的關鍵因素，而不是技術能力本身。

---

## 參考資料

1. [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024/) — 開發者工作效率、工具偏好與自動化採用率的全球調查
2. [Google Testing Blog — Test Infrastructure](https://testing.googleblog.com/) — 測試基礎設施設計與工具整合的工程實踐
3. [DORA 2024 State of DevOps Report](https://dora.dev/research/2024/dora-report/) — 流程自動化與工具整合對軟體交付效能的影響
4. [Martin Fowler — Continuous Delivery](https://martinfowler.com/delivery.html) — 持續交付中的工具鏈設計與自動化原則
5. [Ministry of Testing — Tooling & Automation](https://www.ministryoftesting.com/) — QA 工具選擇與流程設計的社群討論與實戰經驗
