# QA 抓蟲實戰課 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write a 9-chapter QA course (`docs/course-bughunt/`) on the craft of finding, reproducing, reporting, and chasing bugs to closure — plus a README — all as local drafts matching the existing course style.

**Architecture:** Each chapter is one markdown file with frontmatter (`title`/`excerpt`/`tags`/`status: draft`), a hook opening, 2-4 `##` method sections, often a 對照 (contrast) block, and a `## 帶得走` bullet recap. Content is grounded in an internal reference skeleton (RST/SFDPOT/FEW HICCUPPS, Minimal Reproducible Example, Severity-vs-Priority, defect lifecycle) but written as general knowledge — **no source book/author name-drop**.

**Tech Stack:** Markdown. Local preview via `node scripts/preview-course.mjs docs/course-bughunt` → `_preview.html`.

---

## Conventions (apply to EVERY article task)

These are the mechanical "tests" each article must pass. Every article task repeats them as steps.

1. **Frontmatter** — exactly these keys, in this order:
   ```
   ---
   title: <課名>
   excerpt: <一段 50-120 字、講這課解決什麼，不劇透清單>
   tags: [<3-4 個繁中標籤>]
   status: draft
   ---
   ```
2. **Body shape** — `# H1` (same as title), hook opening paragraph(s), 2-4 `##` sections with concrete method, end with `## 帶得走` bullet recap (3-4 bullets).
3. **繁中全形標點** — body uses 全形 `，。：「」（）`; exception: inline code, URLs, frontmatter. No half-width `,` `.` in prose.
4. **No source name-drop** — never write book titles or author names (no "Bach"、"Bolton"、"Rapid Software Testing"、"圖解HTTP" 等). Mnemonics like SFDPOT / FEW HICCUPPS may appear ONLY as a plain teaching device (e.g.「可以用一個口訣記住六個維度」), never attributed to anyone. Prefer explaining the idea in plain 繁中.
5. **Length** — aim 45-60 lines markdown (match existing course articles).
6. **Preview check** — after writing, run the preview and confirm the file is picked up (see final task).
7. **Voice** — QA IC 講師；hook 開場；有方法、有具體範例（程式碼/輸入值/對照）；不寫成乾 tips 清單。

Style reference to read before writing: `docs/course-comm/article-C09-bug-report.md`.

---

## Task 1: 課程 README

**Files:**
- Create: `docs/course-bughunt/README.md`

- [ ] **Step 1: Write the README**

Match the format of `docs/course-comm/README.md`: a `#` title, a `>` blockquote block (定位/教學哲學/視角/狀態), a 「課程定位」 section, a 「與其他課的交叉」 table, then the 課綱 (9 課 / 3 模組). Use this content:

- Title: `# QA 抓蟲實戰：找得到、釘得死、追得到底`
- 定位 blockquote: 抓蟲是科學不是運氣；測試工程師核心硬實力 = 找出 bug（破壞性思維）、釘死（重現的科學方法）、追到修好（協調與追蹤）；順著 bug 的一生編排 找→釘→關；草稿（本地），一課一檔。
- 課程定位 bullets: 破壞性測試是高階能力；重現是可拆解的科學方法；缺陷追蹤是 QA 含金量最高的軟實力；與溝通課/品質課從 craft 視角互補。
- 交叉 table（本課 | 連到 | 分工）:
  - B06 缺陷報告結構 | 溝通課 C09 | 本課=結構/證據；C09=措辭/口氣
  - C07 釐清異常 | 溝通課 C10 | 本課=判斷方法；C10=怎麼說
  - C08 缺陷分級 | 品質課 E05 | 本課=QA 判斷；E05=管理/指標
- 課綱: list the 9 chapters under 3 modules (A 破壞性思維 / B 重現與報告 / C 協調與追蹤) using the titles from Tasks 2-10.

- [ ] **Step 2: Verify frontmatter not required for README, full-width punctuation used**

README has no frontmatter (matches other course READMEs). Confirm 全形標點 in prose.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/README.md
git commit -m "docs(course-bughunt): 課程 README 與課綱"
```

---

## Task 2: A01 逆向思維

**Files:**
- Create: `docs/course-bughunt/article-A01-reverse-thinking.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 逆向思維：從「它能動」到「我要弄壞它」
excerpt: 正向測試確認軟體能動，破壞性測試才是高階能力——它要求你從失敗場景倒推、質疑「使用者會乖乖照流程走」的假定。這篇講怎麼把腦袋從「驗證它對」切換到「證明它會壞」。
tags: [破壞性測試, 探索式測試, 測試思維, QA 實戰]
status: draft
---
```

Required `##` sections (concrete, with examples):
- **正向 vs 逆向**：正向=跟著規矩走、確認 happy path；逆向=從結果倒推、故意反其道而行。
- **從失敗場景倒推**：不只測「成功付費」，而是「扣款成功但網路中斷」「使用者在扣款瞬間狂點上一頁」系統怎麼防禦。
- **質疑假定前提**：開發者常假設「使用者照流程走、看提示、無惡意」；逆向思維假設使用者不懂科技、不看提示、甚至有惡意——開發者的盲區就是 bug 溫床。
- **心態轉變**：從「這不可能發生」到「百萬分之一的機率在真實世界必然被踩到」；破壞不是找麻煩，是逼出系統的優雅降級（壞了也要友善提示，不是整片白畫面）。

End with `## 帶得走` (3-4 bullets recapping the above).

- [ ] **Step 2: Mechanical checks** — frontmatter keys/order correct; 全形標點; has `## 帶得走`; no source name-drop; ~45-60 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/article-A01-reverse-thinking.md
git commit -m "docs(course-bughunt): A01 逆向思維"
```

---

## Task 3: A02 攻擊維度地圖

**Files:**
- Create: `docs/course-bughunt/article-A02-attack-dimensions.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 攻擊維度地圖：系統有哪些面可以打
excerpt: 破壞性測試不是亂打，是有系統地攻擊每個維度。這篇給你一張維度地圖（結構、功能、資料、平台、操作、時間），再配上瘋狂操作、資源中斷、髒資料、併發競態四種實戰手法。
tags: [破壞性測試, 邊界測試, 併發測試, QA 實戰]
status: draft
---
```

Required `##` sections:
- **一張維度地圖**：用一個口訣記住六個可攻擊維度——結構、功能、資料、平台、操作、時間（plain 繁中解釋每個維度可以怎麼打；**不掛來源/作者**，可說「有個好記的口訣」）。
- **瘋狂操作（連點/狂刷）**：連點「送出」20 次→重複扣款/資料庫鎖死（deadlock）；目的=測連續觸發事件的防禦。
- **資源中斷**：核心交易時切網路（Wi-Fi↔4G）、飛航模式、拔線；驗證失去連線時能正確中斷與復原，不讓資料卡半空（扣了錢沒拿到商品）。
- **髒資料注入**：年齡 -1、名字 10000 字、金額 0.000001、SQL 注入字串；測後端 validation，避免崩潰或洩漏個資。
- **併發競態**：兩分頁同帳號，A 買光 B 同時買；測狀態同步與防超賣。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/article-A02-attack-dimensions.md
git commit -m "docs(course-bughunt): A02 攻擊維度地圖"
```

---

## Task 4: A03 一致性判準

**Files:**
- Create: `docs/course-bughunt/article-A03-consistency-oracles.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 怎麼認得「這是 bug」：一致性判準
excerpt: 破壞之後，你得認得出異常。「我覺得怪怪的」不夠專業——這篇把它變成可說明的判準：產品該與它的歷史、可比產品、使用者期待、規格與合理性一致，不一致的地方就是 bug 的線索。
tags: [測試判準, oracle, 探索式測試, QA 實戰]
status: draft
---
```

Required `##` sections:
- **bug 是「不一致」**：你說某行為是 bug，背後一定有個「它本來該怎樣」的參照。把參照講明白，主觀就變客觀。
- **該與什麼一致**（用一組可記的判準，plain 繁中，不掛來源）：與**歷史行為**一致（以前不會這樣）、與**可比產品**一致（同類 App 都不是這樣）、與**使用者期待**一致、與**規格/文件**一致、與**自身**一致（同個功能兩個入口行為不該不同）、與**合理性/目的**一致（這結果對業務說不通）。
- **怎麼用**：探索時心裡掛著這組判準，逐一問「這跟什麼不一致？」——能把模糊的不安變成可寫進報告的具體判準，也能擋掉「這是 feature 不是 bug」的爭論（你指得出跟哪個參照衝突）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/article-A03-consistency-oracles.md
git commit -m "docs(course-bughunt): A03 一致性判準"
```

---

## Task 5: B04 重現是科學方法

**Files:**
- Create: `docs/course-bughunt/article-B04-scientific-reproduction.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 重現是科學方法：控制變數與最小重現
excerpt: 重現 bug 就像法醫驗屍——邏輯不嚴密，工程師就找不到病因。這篇用控制變數法、邊界值分析、最小重現步驟，把「我這邊會壞」變成一條工程師能照走的最短路徑。
tags: [缺陷重現, 控制變數, 邊界值, QA 實戰]
status: draft
---
```

Required `##` sections:
- **控制變數法**：每次只改一個條件（網路/瀏覽器/輸入資料），鎖定引發 bug 的關鍵因素；一次改多個就永遠不知道是哪個。
- **邊界值分析**：欄位限 10 字就測 0、10、11；off-by-one 是 bug 的聚集地。給一個小表（輸入→預期）。
- **削到最小重現**：把 10 步操作削成最關鍵 3 步，剔除無關干擾；削減過程本身常常就讓你發現根因——只有你（重現者）能高效做這件事。
- **對照**：一份「我點來點去就壞了」vs 一份「① ② ③ → 必現」的差異。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/article-B04-scientific-reproduction.md
git commit -m "docs(course-bughunt): B04 重現是科學方法"
```

---

## Task 6: B05 偶發 bug 怎麼抓

**Files:**
- Create: `docs/course-bughunt/article-B05-flaky-bugs.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 偶發 bug 怎麼抓：重現率、日誌、變數隔離
excerpt: 最難搞的不是必現的 bug，是十次出現三次的那種。這篇給你抓偶發 bug 的系統方法：標好重現率、從日誌找蛛絲馬跡、隔離變數，並認得偶發背後最常見的幾個成因。
tags: [偶發缺陷, 日誌判讀, 缺陷重現, QA 實戰]
status: draft
---
```

Required `##` sections:
- **先標重現率**：100% 必現 / 5-10 偶發 / 難以重現——這個標註直接影響工程師的處理方式，也避免雙方「通靈」。
- **從日誌找線索**：重現時同步看前端 Console、後端 Server Log；從報錯（如 500）找蛛絲馬跡；附 Request ID/時間戳對齊前後端。
- **變數隔離**：偶發=有個你還沒控制住的變數。逐一固定（同帳號、同資料、同網路、同時間點）看還偶不偶發。
- **偶發的常見成因**（讓讀者有 checklist）：時序/競態、快取狀態、外部相依（第三方/網路）、測試資料殘留、環境差異。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/article-B05-flaky-bugs.md
git commit -m "docs(course-bughunt): B05 偶發 bug 怎麼抓"
```

---

## Task 7: B06 缺陷報告

**Files:**
- Create: `docs/course-bughunt/article-B06-defect-report.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 寫一份 RD 一分鐘看懂的缺陷報告
excerpt: 一份好報告讓工程師一分鐘看懂、立刻開工；一份壞報告換來十回合反問。這篇講報告的結構與證據邏輯——標題三要素、客觀描述、附對的證據。著重「怎麼組織」，措辭口氣交給溝通課。
tags: [缺陷報告, bug report, 證據, QA 實戰]
status: draft
---
```

Required `##` sections:
- **報告骨架**：標題、嚴重度、環境、前置條件、重現步驟、預期 vs 實際、佐證。給一個完整範例（如購物車 100 件結帳 500）。
- **標題三要素**：在哪裡、做什麼、發生什麼事。「[購物車] 商品超過 100 件結帳跳 500」勝過「結帳壞了」。
- **客觀描述，別下診斷**：寫你看到什麼（畫面白、回 500），別寫你猜是什麼（後端掛了）；要放推測就標明「這是推測」與現象分開。
- **附對的證據**：螢幕錄影、報錯截圖、Network 紀錄、Stack Trace、Request ID——讓對方不用回頭問你要。
- 文末一行內鏈提示：措辭與口氣見溝通課「回報 bug」（純文字提及，不放實際 URL）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions. Note this overlaps comm C09 by design; ensure focus stays on **structure/evidence**, not tone.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/article-B06-defect-report.md
git commit -m "docs(course-bughunt): B06 缺陷報告"
```

---

## Task 8: C07 釐清異常

**Files:**
- Create: `docs/course-bughunt/article-C07-clarify-anomaly.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 釐清異常：把 bug 交對人
excerpt: 在把 bug 丟給 RD 前，先做功課——分清前端還後端、排除環境汙染造成的偽 bug、用對事不對人的方式描述。這篇講怎麼把「好像壞了」釐清成「這是哪一層的問題」。
tags: [缺陷分析, 前後端區分, 環境汙染, QA 實戰]
status: draft
---
```

Required `##` sections:
- **分前端還後端**：用 DevTools Network 判斷——前端渲染出錯（給 Frontend）vs API 回錯誤碼/結構不對（給 Backend）。交對人省一輪轉手。
- **排除環境汙染**：先確認不是舊快取、測試資料被改、環境本身不穩造成的「偽 bug」，再開單；偽 bug 開單會消耗信任。
- **對事不對人**：描述現象不評判能力。❌「你的登入壞掉了，寫得很有問題」 ⭕「測試帳號登入時回 403，麻煩看一下」。主動附最補的線索（Request ID/Payload/Stack Trace）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/article-C07-clarify-anomaly.md
git commit -m "docs(course-bughunt): C07 釐清異常"
```

---

## Task 9: C08 Severity 不等於 Priority

**Files:**
- Create: `docs/course-bughunt/article-C08-severity-vs-priority.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 缺陷分級：Severity 不等於 Priority
excerpt: 很多人把「嚴重度」和「優先級」混為一談，結果跟 RD、PM 雞同鴨講。這篇把兩者拆清楚——Severity 是技術影響、客觀、QA 定；Priority 是業務急迫、主觀、PM 定——再講 P0-P2 怎麼分與 Known Issue 取捨。
tags: [缺陷分級, severity, priority, 缺陷管理]
status: draft
---
```

Required `##` sections:
- **兩個常被混用的詞**：Severity=這 bug 對功能的技術影響（客觀、QA 判、較不變）；Priority=該多急著修（主觀、業務驅動、PM 判、會隨情況變）。
- **高 Severity 低 Priority 的實例**：罕用的後台匯出功能崩潰（Severity 高、但幾乎沒人用→ Priority 低）；vs 首頁 logo 連結錯（Severity 低、但天天被看到→ Priority 高）。讓讀者真的懂兩軸獨立。
- **P0-P2 怎麼分**：P0 阻斷（核心流程卡死/崩潰/嚴重資安）、P1 嚴重（主功能異常但有替代路徑）、P2 輕微（錯字/樣式，可下版）。
- **跟 PM 對齊與 Known Issue**：RD 說「來不及修」時，拉 PM 三方評估是否擋上線；非核心 P2 可轉「已知問題」留待下個迭代。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions. This chapter is the spec's 核心修正點: make the Severity/Priority distinction crisp and correct.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/article-C08-severity-vs-priority.md
git commit -m "docs(course-bughunt): C08 Severity vs Priority"
```

---

## Task 10: C09 驗證修復與回歸

**Files:**
- Create: `docs/course-bughunt/article-C09-verify-and-regression.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 驗證修復與回歸：別只測那一個點
excerpt: RD 說「改好了」，你只測原本壞的那個點就放行嗎？這篇講缺陷的最後一哩——缺陷生命週期、漣漪效應、波及範圍評估，讓修好的 bug 不會帶出三個新的。
tags: [回歸測試, 漣漪效應, 缺陷生命週期, QA 實戰]
status: draft
---
```

Required `##` sections:
- **缺陷的一生**：New→Assigned→Open→Fixed→Retest→Closed；跳過 Retest 就是放掉回歸逃逸。QA 的責任到 Closed，不是 Fixed。
- **問 RD 改了哪段**：多問一句「這次動了哪部分的程式碼？」，才知道要連帶測什麼。
- **漣漪效應與波及範圍**：改了購物車計算邏輯 → 除了該商品，連帶測折價券、免運門檻、稅金。給一個「改一處、要回歸這些」的對照。
- **怎麼決定回歸範圍**：依改動的模組往外推一層相依功能；高風險改動配一輪冒煙。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions.

- [ ] **Step 3: Commit**

```bash
git add docs/course-bughunt/article-C09-verify-and-regression.md
git commit -m "docs(course-bughunt): C09 驗證修復與回歸"
```

---

## Task 11: 預覽與整課驗收

**Files:**
- Read-only check of all files in `docs/course-bughunt/`

- [ ] **Step 1: Generate the preview**

Run: `node scripts/preview-course.mjs docs/course-bughunt`
Expected: produces `docs/course-bughunt/_preview.html` with all 9 chapters + correct titles in the sidebar, no parse errors.

- [ ] **Step 2: Cross-article consistency check**

Confirm across all 9 articles:
- All have frontmatter with `title`/`excerpt`/`tags`/`status: draft`.
- All end with `## 帶得走`.
- 全形標點 in prose (spot-check for stray half-width `,` `.` in body).
- No source book/author name-drop anywhere (grep for `Bach`, `Bolton`, `Rapid Software`, book titles).
- README 課綱 titles match the 9 article `title:` lines.

Run: `grep -rl "Bach\|Bolton\|Rapid Software\|圖解" docs/course-bughunt/ || echo "clean: no name-drops"`
Expected: `clean: no name-drops`

- [ ] **Step 3: Final commit (if any fixes were made)**

```bash
git add docs/course-bughunt/
git commit -m "docs(course-bughunt): 整課一致性修正與預覽"
```

(If no fixes needed, skip — `_preview.html` is gitignored.)

---

## Notes / Out of Scope (follow-up)

- 上線到 Supabase / 設 `published`（沿用既有 seed/upload 流程，另行處理）。
- 後台課程封面、章節封面。
- 跨課內鏈的實際 URL（等其他課上線後補；本次僅純文字提及）。
