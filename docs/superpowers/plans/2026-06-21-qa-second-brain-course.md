# QA 的第二大腦課程 — 寫稿計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 寫完 9 篇方法論文章 + README,組成「QA 的第二大腦」課程,放 `docs/course-second-brain/`,全 draft 待發布。

**Architecture:** 痛點先行的方法論課。每篇一個真實 QA 痛點 × 一個知識管理武器。BASB(Capture→Organize→Distill→Express、PARA、可重用知識塊、漸進蒸餾)當內部骨架,**不寫進讀者正文**。工具無關。

**Tech Stack:** 純 Markdown 文章。無程式碼、無測試框架。驗收 = 對照寫作慣例人工檢查。

> **Spec:** `docs/superpowers/specs/2026-06-21-qa-second-brain-course-design.md`(寫每篇前先讀)

---

## 全課寫作慣例(每篇都套,寫完逐項檢查)

每篇文章的「驗收檢查」都是這份清單,不重複寫進每個 Task:

- [ ] **Hook**:第一段是具體痛點場景,不講大道理。
- [ ] **結構**:觀念 → 怎麼想 → 可落地做法。
- [ ] **收尾**:「帶得走」一小段,給一個今天就能動手的最小行動。
- [ ] **工具無關**:舉例用中性語言(「一個 case 庫」),不做特定工具教學。
- [ ] **zh-TW 全形標點**:正文用全形,跳過 frontmatter / inline code。
- [ ] **不 name-drop**:不提來源書名 / 作者,當通用知識寫。
- [ ] **內部骨架不外露**:BASB 階段名詞只在 spec / 計畫,不寫進正文。
- [ ] **frontmatter**:含 title / tags(對齊既有文章格式,參考 `docs/course-api/article-A01-*.md` 開頭)。
- [ ] **篇幅**:跟既有課單篇相當(約 1500–2500 字),不灌水。

**起手動作(每個 Task 第一步都做)**:讀 spec + 讀一篇既有課文章(如 `docs/course-api/article-A01-why-api-testing.md` 任一)抓 frontmatter 與語氣。

---

## Task 1:建 README

**Files:**
- Create: `docs/course-second-brain/README.md`

- [ ] **Step 1**:讀 `docs/course-api/README.md` 抓結構(定位引言 / 課程定位 bullets / 交叉內鏈表 / 課綱)。

- [ ] **Step 2**:依 spec 第四節草案寫 README。必含:
  - 標題:`# QA 的第二大腦 — 把測試知識變成會自己浮現的系統`
  - 定位引言區塊(spec 第四節 blockquote 原文)
  - 課程定位 3 bullets(甜蜜點 / 觀念為主 / 可落地)
  - 交叉內鏈表(spec 第四節表格)
  - 課綱表(spec 第二節 9 列,**只留「# / 痛點 hook / 帶走的武器」三欄,砍掉 BASB 對應欄**——那欄是內部骨架不外露)

- [ ] **Step 3**:對照「全課寫作慣例」檢查(zh-TW 標點、不 name-drop、BASB 詞不入表)。

- [ ] **Step 4**:Commit
```bash
git add docs/course-second-brain/README.md
git commit -m "docs(course-second-brain): README — 課綱與定位"
```

---

## Task 2:S01 — 為什麼 QA 需要第二大腦

**Files:**
- Create: `docs/course-second-brain/article-S01-why-qa-second-brain.md`

**內容骨架:**
- **Hook**:「那個邏輯只有 Mary 知道,她請假就停擺」——團隊卡在某人腦袋裡的知識,bus factor = 1。
- **怎麼想**:測試知識是 QA 最大的隱形資產(業務規則、踩過的雷、回歸範圍判斷),但多數人靠記憶 + 散落文件,知識隨人走。外部化的投報:省重複問、省重造、降 onboarding 成本。
- **帶走的武器**:第二大腦的定義(可檢索 / 可重用 / 會自己浮現),以及後續 8 章的地圖(本篇當總綱,點名後面每章解一個痛點)。
- **收尾**:今天最小行動——挑一個「只有你知道」的業務邏輯,寫下來放進一個固定地方。

- [ ] **Step 1**:讀 spec + 一篇既有課文章。
- [ ] **Step 2**:依骨架寫稿。
- [ ] **Step 3**:逐項對「全課寫作慣例」檢查。
- [ ] **Step 4**:Commit `docs(course-second-brain): draft S01 — 為什麼 QA 需要第二大腦`

---

## Task 3:S02 — 蒐集漏斗

**Files:**
- Create: `docs/course-second-brain/article-S02-capture-funnel.md`

**內容骨架:**
- **Hook**:需求散在 Slack / Figma / Jira / 站會嘴上講,你永遠在問「這版到底要幹嘛」。
- **怎麼想**:知識消失在「蒐集」這關。原則:單一入口、抓進來再說(降低 capture 門檻)、來源可追(回得去原始出處)。區分「值得留」的訊號(會影響測試的決定、規則、邊界)。
- **可落地做法**:設一個 inbox(任何工具都行);capture 時帶最小 metadata(來源連結 + 日期);定期清 inbox 進正式位置。
- **收尾**:今天最小行動——開一個 inbox,下次需求討論完立刻丟一條進去。

- [ ] **Step 1**:讀 spec。
- [ ] **Step 2**:依骨架寫稿。
- [ ] **Step 3**:逐項檢查。
- [ ] **Step 4**:Commit `docs(course-second-brain): draft S02 — 蒐集漏斗`

---

## Task 4:S03 — 組織:讓活的浮上來

**Files:**
- Create: `docs/course-second-brain/article-S03-organize-para.md`

**內容骨架:**
- **Hook**:測試案例庫長到沒人信、沒人敢刪,一打開全是不知道還準不準的東西。
- **怎麼想**:組織的軸不是「主題」而是「行動性」。四層分法(用中性詞,不照搬 PARA 原名,但概念對應):
  - 正在進行的測試任務(這版要測的)
  - 長期要顧的領域(常駐功能 / 模組)
  - 可能用到的參考(規格、heuristic、共用 checklist)
  - 封存(過期但不刪,可回溯)
- **可落地做法**:活的東西放手邊、死的下沉到封存;封存而非刪除(保留歷史 + 心理負擔降低)。
- **收尾**:今天最小行動——把 case 庫裡一眼看出過期的東西移到「封存」,別刪。

- [ ] **Step 1**:讀 spec。
- [ ] **Step 2**:依骨架寫稿。
- [ ] **Step 3**:逐項檢查。
- [ ] **Step 4**:Commit `docs(course-second-brain): draft S03 — 組織:讓活的浮上來`

---

## Task 5:S04 — 可重用知識塊

**Files:**
- Create: `docs/course-second-brain/article-S04-reusable-blocks.md`

**內容骨架:**
- **Hook**:每次新功能都從零設計 case,同樣的登入 / 權限 / 邊界 checklist 一再重造輪子。
- **怎麼想**:把反覆用到的測試思路固化成「零件」——test pattern、heuristic checklist、共用測試資料設定。下次組裝而非重想。
- **可落地做法**:辨識哪些 case 設計其實是通用 pattern;抽成獨立、有名字、可被引用的塊;設計新功能時先翻零件庫。
- **內鏈**:既有文章 test-case-writing、risk-based-testing。
- **收尾**:今天最小行動——把你最近寫的一組 case 裡的通用部分,抽成一個有名字的 checklist。

- [ ] **Step 1**:讀 spec。
- [ ] **Step 2**:依骨架寫稿。
- [ ] **Step 3**:逐項檢查。
- [ ] **Step 4**:Commit `docs(course-second-brain): draft S04 — 可重用知識塊`

---

## Task 6:S05 — 把 case 連到業務規則

**Files:**
- Create: `docs/course-second-brain/article-S05-link-case-to-rule.md`

**內容骨架:**
- **Hook**:「這次改動要回歸哪些?」算不出來,只能憑記憶圈一圈,漏了就炸。
- **怎麼想**:回歸範圍算不出來,是因為 case 跟業務規則沒連結。建立 case ↔ 規則 ↔ 功能的連結網,改動一個點,受影響的 case 自己浮現。
- **可落地做法**:每條業務規則一個節點,case 指向它;改規則時順著連結找 case;用任何能做交叉引用的工具(tag / 連結 / 欄位)。
- **內鏈**:requirements-analysis、user-story-mapping-qa。
- **收尾**:今天最小行動——挑一條核心業務規則,把指向它的 case 列出來,看看連結斷在哪。

- [ ] **Step 1**:讀 spec。
- [ ] **Step 2**:依骨架寫稿。
- [ ] **Step 3**:逐項檢查。
- [ ] **Step 4**:Commit `docs(course-second-brain): draft S05 — case 連業務規則`

---

## Task 7:S06 — 把 bug 蒸餾成測試啟發

**Files:**
- Create: `docs/course-second-brain/article-S06-bug-to-heuristic.md`

**內容骨架:**
- **Hook**:同一類 bug 每季重來,team 修完就忘,下次新人 / 新功能又踩一樣的坑。
- **怎麼想**:bug 修掉只解決一次,把 bug 蒸餾成「測試啟發」才讓痛只痛一次。從單一 bug 抽出可泛化的檢查點。
- **可落地做法**:漸進蒸餾——bug 紀錄 → 抓出根因模式 → 寫成一條可重用的測試 heuristic → 進零件庫(接 S04)。
- **內鏈**:bug-report-clarity、why-testing-problems-never-get-solved。
- **收尾**:今天最小行動——翻最近一個 bug,寫一句「以後測 X 時要記得檢查 Y」。

- [ ] **Step 1**:讀 spec。
- [ ] **Step 2**:依骨架寫稿。
- [ ] **Step 3**:逐項檢查。
- [ ] **Step 4**:Commit `docs(course-second-brain): draft S06 — bug 蒸餾成啟發`

---

## Task 8:S07 — onboarding 地圖

**Files:**
- Create: `docs/course-second-brain/article-S07-onboarding-map.md`

**內容骨架:**
- **Hook**:新人接手三個月還在問基本業務邏輯,你一邊測一邊當人肉文件。
- **怎麼想**:第二大腦本身就是最好的 onboarding 資產。缺的是「地圖」——索引筆記(MOC),把散落知識串成可導覽的入口。
- **可落地做法**:做幾張索引筆記(依模組 / 依功能),每張連到底層的規則、case、heuristic;新人從地圖進,而非翻整個庫。
- **內鏈**:qa-onboarding-new-product。
- **收尾**:今天最小行動——挑一個模組,做一張索引筆記,列出新人該知道的 5 個入口。

- [ ] **Step 1**:讀 spec。
- [ ] **Step 2**:依骨架寫稿。
- [ ] **Step 3**:逐項檢查。
- [ ] **Step 4**:Commit `docs(course-second-brain): draft S07 — onboarding 地圖`

---

## Task 9:S08 — 輸出導向

**Files:**
- Create: `docs/course-second-brain/article-S08-express-output.md`

**內容骨架:**
- **Hook**:知識囤一堆卻用不出來,測試計畫 / 報告每次還是臨時從零拼。
- **怎麼想**:囤積本身沒價值,知識要可行動。前面建的零件(S04)、連結(S05)、啟發(S06)在這裡組裝成輸出:測試計畫、覆蓋圖、測試報告。
- **可落地做法**:寫計畫 / 報告時先翻庫找現成零件再組;讓每次輸出反過來補充庫(輸出即蒸餾)。
- **收尾**:今天最小行動——下次寫測試計畫,先翻庫看有哪些段落可以直接搬。

- [ ] **Step 1**:讀 spec。
- [ ] **Step 2**:依骨架寫稿。
- [ ] **Step 3**:逐項檢查。
- [ ] **Step 4**:Commit `docs(course-second-brain): draft S08 — 輸出導向`

---

## Task 10:S09 — 維護習慣(收尾)

**Files:**
- Create: `docs/course-second-brain/article-S09-maintain-habit.md`

**內容骨架:**
- **Hook**:系統建好,三個月後沒人維護又爛回去,變成另一個沒人信的墳場。
- **怎麼想**:第二大腦不是一次性專案,是長在工作流裡的習慣。重點是輕量(維護成本低到不會放棄)。
- **可落地做法**:把 capture / 整理 / 蒸餾嵌進既有節奏(站會後丟 inbox、版本收尾做一次封存、定期回顧);不追求完美結構,追求持續活著。回顧全課 9 章串起來。
- **收尾**:今天最小行動——設一個每週 10 分鐘的固定維護時段。

- [ ] **Step 1**:讀 spec。
- [ ] **Step 2**:依骨架寫稿。
- [ ] **Step 3**:逐項檢查。
- [ ] **Step 4**:Commit `docs(course-second-brain): draft S09 — 維護習慣`

---

## Task 11:收尾校對

**Files:**
- Modify: 全 `docs/course-second-brain/*.md`

- [ ] **Step 1**:通讀 9 篇 + README,檢查語氣一致、痛點不重複、內鏈正確。
- [ ] **Step 2**:zh-TW 全形標點正規化(跳過 frontmatter / inline code)。
- [ ] **Step 3**:確認沒有任何 BASB 書名 / 作者 / CODE / PARA 等術語洩漏進正文。
- [ ] **Step 4**:Commit `docs(course-second-brain): polish pass — 全課校對`

---

## Self-Review(計畫對 spec)

- **Spec 覆蓋**:spec 第二節 9 篇 → Task 2–10 各一篇 ✓;README → Task 1 ✓;寫作慣例 → 全課慣例區塊 + 每 Task Step 3 ✓;非目標(不綁工具 / 不擴篇 / 無程式碼)→ 慣例與骨架已守 ✓。
- **Placeholder 掃描**:每 Task 有具體 hook + 骨架 + commit message,無 TBD ✓。
- **一致性**:檔名前綴全 `S`、prefix 不撞既有課 ✓;commit message 格式統一 `docs(course-second-brain): ...` ✓。
