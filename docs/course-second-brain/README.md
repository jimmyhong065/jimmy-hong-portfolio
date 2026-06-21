# QA 的第二大腦 — 把測試知識變成會自己浮現的系統

> 定位：教 QA 把腦袋裡的測試知識、業務邏輯外部化成可檢索、可重用、會自己浮現的系統。
> 教學哲學：痛點先行，知識管理方法論為主——跟 perf/api 課同節奏。每章一個真實痛點 × 一個武器。
> 視角：QA IC 講師。每篇 hook 開場、給可落地做法、收尾「帶得走」。
> 工具立場：工具無關。原則跟結構為主，TestRail / Notion / Confluence / Obsidian / Excel 都能套。
> 狀態：草稿（本地）。一課一檔 `article-Sxx-*.md`。

## 課程定位

- **甜蜜點**：測試知識是 QA 最大的隱形資產，但多數人靠記憶 + 散落文件，知識隨人走。
- **觀念為主**：先講「為什麼會爛、怎麼想」，再講「怎麼建、怎麼維護」。
- **可落地**：每章一個武器，讀完能直接動手改自己的 case 庫 / 筆記。

## 與其他文章的交叉（可選內鏈，不強綁）

| 本課 | 連到 |
|---|---|
| S04 可重用知識塊 | 既有文章 test-case-writing 思路、risk-based-testing |
| S05 case 連業務規則 | requirements-analysis、user-story-mapping-qa |
| S06 bug 蒸餾成啟發 | bug-report-clarity、why-testing-problems-never-get-solved |
| S07 onboarding 地圖 | qa-onboarding-new-product |

## 課綱（9 課）

| # | 痛點 | 帶走的武器 |
|---|---|---|
| S01 | 「那個邏輯只有 Mary 知道，她請假就停擺」— 知識的 bus factor | 為什麼 QA 比誰都需要第二大腦；知識外部化的投報 |
| S02 | 需求散在 Slack / Figma / Jira / 嘴巴，你永遠在問「這版到底要幹嘛」 | 蒐集漏斗：單一入口、抓進來再說、來源可追 |
| S03 | 測試案例庫長到沒人信、沒人敢刪 | 用「專案 / 領域 / 資源 / 封存」分，讓活的浮上來、死的下沉 |
| S04 | 每次都從零設計 case，同樣的 checklist 重造輪子 | 可重用知識塊（test pattern、heuristic checklist） |
| S05 | 「這次改動要回歸哪些？」算不出來，只能憑記憶 | 把 case 連到業務規則，改動一觸、影響範圍自己浮現 |
| S06 | 同一類 bug 每季重來，團隊學不到教訓 | 把 bug 蒸餾成測試啟發，讓痛只痛一次 |
| S07 | 新人接手三個月還在問基本業務邏輯 | 第二大腦當 onboarding 資產：索引筆記當地圖 |
| S08 | 知識囤一堆卻用不出來，測試計畫 / 報告還是臨時拼 | 輸出導向：知識要可行動，計畫 / 報告由零件組起來 |
| S09 | 系統建好但沒人維護，三個月後又爛回去 | 養成習慣：輕量維護、定期回顧、讓系統長在工作流裡 |

## 每篇格式規範

- **frontmatter**：`title` / `excerpt` / `tags`（含「知識管理」+ 主題標籤）/ `status: draft`
- **結構**：hook 開場（痛點或反直覺場景）→ 觀念 → 實戰做法 → 收尾「帶得走」條列 → 內鏈
- **字數**：觀念篇 ~1300〜1500 字
- **語言慣例**：繁中正文用全形標點（跳過 frontmatter／inline code／code fence）；不提來源書名／作者，當通用知識寫

## 狀態

全 9 課待起草。發布走 publish-qa-blog 流程（一次一篇 upload 到 Supabase）。
