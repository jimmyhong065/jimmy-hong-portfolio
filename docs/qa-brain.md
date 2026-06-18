# QA Brain：讓 AI 真的懂你的產品，而不是亂猜

---

## 目錄

1. [AI 給的測試案例為什麼沒用](#為什麼沒用)
2. [QA Brain 是什麼](#是什麼)
3. [五層架構](#五層架構)
4. [Workflow Skills](#workflow-skills)
5. [防止 AI 腦補](#防止腦補)
6. [結尾](#結尾)

---

## AI 給的測試案例為什麼沒用

用 AI 幫忙想測試案例，第一次試的時候通常有點失望。

給 AI 一段需求描述，它會生成一批測試案例——格式整齊、邏輯清楚，但大部分是通用的「正常流程、空值、超長字串」，完全沒有考慮這個產品的歷史 bug、這個模組的邊界邏輯、這個 AC 裡沒寫清楚的隱含規則。Stack Overflow 2024 Developer Survey 顯示，超過 75% 的開發者已在工作中使用 AI 工具；但 Capgemini《World Quality Report 2024-25》同步指出，AI 輔助測試的最大挑戰不是技術整合，而是「如何確保 AI 有足夠的業務知識來生成有意義的測試案例」。

原因很簡單：AI 不知道你的產品。

你把需求丟給它，它從需求本身推測，但測試案例的價值往往在需求沒有寫的地方——之前踩過的坑、裝置特定行為、活動機制和計時邏輯的交互。這些東西在 AI 腦子裡沒有，就只能猜。

QA Brain 要解決的問題是：讓 AI 有足夠的產品知識，不需要猜。

---

## QA Brain 是什麼

QA Brain 是一個結構化的 QA 知識庫，同時也是 AI 的操作框架。

兩個功能：

1. 把分散的 QA 知識整理成有 schema、可驗證的結構
2. 讓 AI 在執行 QA 任務時，能讀到正確的知識層，用對的工作流程完成任務

不是把文件塞給 AI 然後問問題，是設計一套架構讓 AI 知道「遇到這個任務，要去哪裡找資料、按什麼流程走」。

---

## 五層架構

```
Layer 1  AGENTS.md            記憶層 / Constitution
Layer 2  raw/                 證據層（唯讀）
Layer 3  wiki/ + WIKI_SCHEMA  知識層
Layer 4  skills/qa-brain-*   工作流程層
Layer 5  scripts/ + outputs/  驗證層
```

**Layer 1 — AGENTS.md**

定義 AI 的身份、風格、風險雷達和 typed graph 規則。這是 AI 每次執行任務前都會讀的 constitution——它知道自己是 QA 的角色、知道什麼風險需要特別標記、知道知識庫的關係圖怎麼解讀。

**Layer 2 — raw/**

原始來源，唯讀。包含 Notion 匯出、Figma spec、Linear 歷史、會議紀錄、測試報告。

這層的規則只有一條：wiki 的結論必須能回溯到 raw 裡的原始資料。AI 做出的判斷如果用到 wiki 知識，要能追溯到這裡，不能憑空斷言。

**Layer 3 — wiki/ + WIKI_SCHEMA.md**

知識層，Karpathy LLM Wiki 概念——把產品知識整理成 AI 容易讀懂的結構：Entity、Module、Topic Map、Bug Pattern。

WIKI_SCHEMA.md 定義這層的格式規範和 typed relationship（例如：`Module → depends_on → Module`、`BugPattern → found_in → Feature`）。有 schema 才有辦法驗證，有驗證才能防止知識腐爛。

**Layer 4 — skills/qa-brain-***

工作流程層。每個任務對應一個 skill，每個 skill 定義「這個任務需要讀哪些 context、按什麼步驟走」。

設計原則：最小必要 context。不是每個任務都把整個 vault 餵給 AI，是根據任務類型選取必要的知識範圍，避免 context 太大反而讓 AI 抓不到重點。

**Layer 5 — scripts/ + outputs/**

驗證層。catalog、lint、audit 腳本定期掃描 wiki 的格式是否符合 schema、relationship 是否有懸空指標、知識是否過期。

這層的存在是為了防止 AI 腦補——如果 AI 在更新 wiki 的時候寫了一個不符合 schema 的節點，驗證層會抓到。

---

## Workflow Skills

不同的 QA 任務對應不同的 skill，AI 根據任務類型選最小必要 context：

| 任務 | Skill |
|---|---|
| 搜尋 / 查詢 / 更新 vault | qa-brain-navigator |
| 需求或 AC 模糊 | qa-brain-requirement-grill |
| 難重現 bug | qa-brain-diagnose-bug |
| Issue 分流 | — |
| 覆蓋率稽核 | — |
| Bug 智慧分析 | — |
| Bug issue review | — |
| TC 設計 | — |
| 測試情境工作流 | — |
| 發版 Gate | — |

以 `qa-brain-requirement-grill` 為例：AC 描述不清楚的時候，AI 不是直接猜，而是按照這個 skill 定義的流程，先去 wiki 找這個 module 的歷史 bug pattern 和邊界規則，再根據這些知識提出針對性的澄清問題，而不是通用的「請問空值怎麼處理」。

`qa-brain-diagnose-bug` 在難重現 bug 的場景下，AI 會先查 Device_Matrix 確認裝置差異、查 Bug Pattern 看有沒有類似的歷史案例，再提出可能的重現路徑，而不是從零開始猜。

---

## 防止 AI 腦補

這套架構最重要的設計決策是：不信任 AI 的記憶，只信任可驗證的知識。

三個機制：

**RESOLVER.md 決策樹**：新增頁面之前，先走決策樹確認放哪個層、哪個分類。不靠「感覺放這裡比較對」，靠規則。

**Typed relationship**：wiki 裡的關係都有明確的 type（depends_on、found_in、tested_by），AI 建立新關係時必須聲明 type，驗證工具才能檢查是否合理。

**唯讀原則**：raw 層任何人都不能直接修改（包括 AI）。wiki 的更新要有 raw 層的來源依據，有來源才能追溯，有追溯才能驗證。

---

## 結尾

AI 輔助 QA 的瓶頸不是 AI 不夠強，是 AI 沒有足夠的產品知識。DORA 2024 的研究指出，文件品質和知識共享是影響軟體交付效能的關鍵因素之一——而 QA Brain 的本質，正是把分散在人腦和歷史記錄裡的 QA 知識，轉化成可讓 AI 讀取、可驗證、可維護的結構化資產。

通用 AI 給的測試案例是通用的；有產品 context 的 AI 給的測試案例才是有價值的。QA Brain 做的事是建立這個 context——結構化、可驗證、可維護，讓 AI 有東西可以依賴，而不是每次都從需求文字重新推測。

這套架構花了一段時間設計，但一旦建起來，每次新功能的測試案例設計、bug 診斷、覆蓋率稽核都快很多。知識是累積的，架構讓累積有地方去。

---

## 參考資料

1. [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024/) — AI 工具在開發者工作流程中的採用現況調查
2. [Capgemini World Quality Report 2024-25](https://www.capgemini.com/insights/research-library/world-quality-report-2024-25/) — AI 輔助測試的挑戰與業界採用趨勢
3. [DORA 2024 State of DevOps Report](https://dora.dev/research/2024/dora-report/) — 文件品質與知識共享對軟體交付效能的影響研究
4. [Google Testing Blog](https://testing.googleblog.com/) — 測試知識體系化與工程文化的實踐參考
5. [Ministry of Testing — Articles & Resources](https://www.ministryoftesting.com/) — QA 知識管理、工具選型與 AI 輔助測試的社群討論
