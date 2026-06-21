# QA 的第二大腦 — 課程設計 spec

> 狀態:設計定稿,待寫稿。
> 日期:2026-06-21
> 類型:方法論課(知識管理),工具無關,痛點先行。

## 一、定位

教 QA 把腦袋裡的測試知識、業務邏輯外部化成一套**可檢索、可重用、會自己浮現**的系統。
靈感來自「第二大腦」(Building a Second Brain)的知識管理方法論,但**不照搬原書詞彙**——當通用知識寫,以 QA 真實痛點為入口。

- **教學哲學**:痛點先行,方法論為主——跟 `docs/course-perf/`、`docs/course-api/` 同節奏。每章一個真實痛點 × 一個知識管理武器。
- **視角**:QA IC 講師。每篇 hook 開場、給可落地做法、收尾「帶得走」。
- **工具立場**:工具無關。講原則跟結構,讀者用 TestRail / Notion / Confluence / Obsidian / Excel 都能套。需要舉例時用中性語言(「一個 case 庫」而非特定產品)。
- **規模**:9 篇(1 開場 + 7 痛點章 + 1 收尾)。
- **BASB 對應(內部骨架,不寫進讀者正文)**:Capture → Organize → Distill → Express 四階段當隱形主軸;PARA、可重用知識塊(Intermediate Packets)、漸進蒸餾(progressive summarization)當各章的方法支撐。

## 二、課綱

| # | 痛點 hook | 帶走的武器 | BASB 對應(內部) |
|---|---|---|---|
| **S01** | 「那個邏輯只有 Mary 知道,她請假就停擺」— 知識的 bus factor | 為什麼 QA 比誰都需要第二大腦;知識外部化的投報 | 開場/總綱 |
| **S02** | 需求散在 Slack / Figma / Jira / 嘴巴,你永遠在問「這版到底要幹嘛」 | 蒐集漏斗:單一入口、抓進來再說、來源可追 | Capture |
| **S03** | 測試案例庫長到沒人信、沒人敢刪 | 用「專案 / 領域 / 資源 / 封存」分,讓活的浮上來、死的下沉 | Organize / PARA |
| **S04** | 每次都從零設計 case,同樣的 checklist 重造輪子 | 可重用知識塊(test pattern、heuristic checklist)——你的零件庫 | Distill / Intermediate Packets |
| **S05** | 「這次改動要回歸哪些?」算不出來,只能憑記憶 | 把 case 連到業務規則,改動一觸,影響範圍自己浮現 | 連結 / linking |
| **S06** | 同一類 bug 每季重來,團隊學不到教訓 | 把 bug 蒸餾成測試啟發,讓痛只痛一次 | Distill / 漸進蒸餾 |
| **S07** | 新人接手三個月還在問基本業務邏輯 | 第二大腦當 onboarding 資產:索引筆記(MOC)當地圖 | Organize / 索引 |
| **S08** | 知識囤一堆卻用不出來,測試計畫 / 報告還是臨時拼 | 輸出導向:知識要可行動,計畫 / 報告由零件組起來 | Express |
| **S09** | 系統建好但沒人維護,三個月後又爛回去 | 養成習慣:輕量維護、定期回顧、讓系統長在工作流裡 | 收尾 / 習慣 |

## 三、檔案結構

跟既有課同構:

```
docs/course-second-brain/
  README.md                          課綱 + 定位 + 交叉內鏈
  article-S01-why-qa-second-brain.md
  article-S02-capture-funnel.md
  article-S03-organize-para.md
  article-S04-reusable-blocks.md
  article-S05-link-case-to-rule.md
  article-S06-bug-to-heuristic.md
  article-S07-onboarding-map.md
  article-S08-express-output.md
  article-S09-maintain-habit.md
```

前綴 `S`(second brain)— 不撞 perf(L)/ k6(K)/ api(ABCD)/ quality(E)。

## 四、README 定位區塊(草案)

```
# QA 的第二大腦 — 把測試知識變成會自己浮現的系統

> 定位:教 QA 把腦袋裡的測試知識、業務邏輯外部化成可檢索、可重用、會自己浮現的系統。
> 教學哲學:痛點先行,知識管理方法論為主——跟 perf/api 課同節奏。每章一個真實痛點 × 一個武器。
> 視角:QA IC 講師。每篇 hook 開場、給可落地做法、收尾「帶得走」。
> 工具立場:工具無關。原則跟結構為主,TestRail / Notion / Confluence / Obsidian / Excel 都能套。
> 狀態:草稿(本地)。一課一檔 article-Sxx-*.md。
```

**課程定位 bullets**:
- 甜蜜點:測試知識是 QA 最大的隱形資產,但多數人靠記憶 + 散落文件,知識隨人走。
- 觀念為主:先講「為什麼會爛、怎麼想」,再講「怎麼建、怎麼維護」。
- 可落地:每章一個武器,讀完能直接動手改自己的 case 庫 / 筆記。

**交叉內鏈**(可選,不強綁):

| 本課 | 連到 |
|---|---|
| S04 可重用知識塊 | 既有文章 test-case-writing 思路、risk-based-testing |
| S05 case 連業務規則 | requirements-analysis、user-story-mapping-qa |
| S06 bug 蒸餾成啟發 | bug-report-clarity、why-testing-problems-never-get-solved |
| S07 onboarding 地圖 | qa-onboarding-new-product |

## 五、每篇寫作慣例(對齊既有課)

- Hook 開場:第一段用一個具體痛點場景,不講大道理。
- 正文:觀念 → 怎麼想 → 可落地做法。工具無關,舉例用中性語言。
- 收尾:「帶得走」一小段,給讀者一個今天就能動手的最小行動。
- zh-TW 全形標點(發布前正規化,跳過 frontmatter / inline code)。
- 不提來源書名 / 作者,當通用知識寫。
- 內部對應欄(BASB 階段)只存在 spec / README,不寫進讀者正文。

## 六、非目標(YAGNI)

- 不綁特定工具、不做工具教學(no Obsidian/Notion step-by-step)。
- 不擴成 16–20 篇;維持 9 篇精實。
- 不做可跑程式碼鷹架(這是方法論課,非實作課)。
