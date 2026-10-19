# QA Lens — Pillar-Cluster 主題權威群地圖

## Pillar 1：自動化測試策略
**Pillar（核心大文）：** `automated-testing-strategy`
> 自動化測試策略：從冰淇淋到金字塔

**Cluster（子題文章）：**
- `appium-article-revised` — Appium CI 實戰
- `appium-self-healing-framework` — Self-Healing 框架
- `tau-pytest-tutorial` — pytest 從零開始
- `tau-pytest-bdd` — BDD + pytest-bdd
- `tau-test-automation-foundation` — 測試自動化基礎
- `when-not-to-automate` — 什麼情況不該自動化
- `testing-ai-generated-code` — AI 寫的 code 怎麼測
- `tau-whole-team-continuous-testing` — 全團隊持續測試

**缺少的 Cluster（可新增）：**
- 「Playwright vs Appium vs Espresso 怎麼選？」
- 「自動化測試覆蓋率要達到多少才夠？」

---

## Pillar 2：CI/CD 測試整合
**Pillar（核心大文）：** `tau-test-automation-in-devops`
> CI 過了不代表沒問題：DevOps 時代的測試策略全貌

**Cluster（子題文章）：**
- `github-actions-qa-intro` — QA 的第一條 GitHub Actions Pipeline ← 目前唯一有 Google 收錄
- `tau-github-actions-for-testing` — GitHub Actions 跑測試完整筆記
- `tau-observability-for-test-automation` — 測試自動化可觀測性
- `k6-article-revised` — k6 效能測試
- `tau-performance-load-testing` — 效能測試課程筆記

**缺少的 Cluster（可新增）：**
- 「GitHub Actions 測試報告怎麼輸出？Allure Report 整合教學」
- 「CI 測試跑太慢？平行化策略與最佳化」

---

## Pillar 3：QA 影響力與團隊協作
**Pillar（核心大文）：** `why-testing-problems-never-get-solved`
> 測試的問題每間公司都有，但為什麼每間公司都沒解決

**Cluster（子題文章）：**
- `qa-influence-architecture` — QA 怎麼影響架構決策
- `qa-pm-test-strategy-alignment` — 測試策略怎麼跟 PM 對齊
- `user-story-mapping-qa` — 拿到票單的時候 QA 已經輸了
- `qa-communication-skills` — QA 的溝通之術
- `qa-team-collaboration` — 兩個 QA 各測各的
- `qa-problem-solving-six-steps` — 六步問題分析法
- `automation-business-value` — 用技術語言跟老闆報告
- `tau-building-quality-leaders` — QA 也能成為領導者
- `qa-leader-ic-collaboration` — Leader 說要改善流程
- `retro-effective-communication` — Retro 說了沒用

---

## Pillar 4：AI 時代的 QA 職涯
**Pillar（核心大文）：** `domain-knowledge-ai-era`
> AI 時代，測試的 Domain Knowledge 比過去更重要

**Cluster（子題文章）：**
- `ai-replaced-qa-6m-loss` — AI 取代 12 人 QA 團隊
- `testing-ai-generated-code` — AI 寫的 code 怎麼測（跨 Pillar 1）
- `swe-at-google-startup` — Software Engineering at Google 讀後感
- `spof-life-design` — 組合人生

**缺少的 Cluster（可新增）：**
- 「QA 工程師怎麼用 AI 工具提升效率？」
- 「Prompt Engineering for QA：寫好測試 Prompt 的技巧」

---

## 內部連結優先施工清單

### 高優先（Pillar → Cluster 雙向連結）
| 文章 | 應連結到 |
|------|----------|
| `automated-testing-strategy` | appium、pytest、when-not-to-automate、testing-ai |
| `tau-test-automation-in-devops` | github-actions-qa-intro、k6、observability |
| `why-testing-problems-never-get-solved` | qa-influence、pm-alignment、communication |
| `domain-knowledge-ai-era` | ai-replaced-qa、testing-ai-generated-code |

### 同 Cluster 間互相連結
| 文章 A | 文章 B |
|--------|--------|
| `appium-article-revised` | `appium-self-healing-framework` |
| `tau-pytest-tutorial` | `tau-pytest-bdd` |
| `github-actions-qa-intro` | `tau-github-actions-for-testing` |
| `k6-article-revised` | `tau-performance-load-testing` |
| `qa-communication-skills` | `qa-pm-test-strategy-alignment` |
| `ai-replaced-qa-6m-loss` | `testing-ai-generated-code` |
