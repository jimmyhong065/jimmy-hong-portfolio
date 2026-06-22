# 測試設計方法論課程 寫作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development（建議）或 superpowers:executing-plans 逐課執行。步驟用 checkbox（`- [ ]`）追蹤。

**Goal:** 在 `docs/course-test-design/` 產出 README + 13 篇原創文章，教測試設計方法論，主線「最少資源最大測試價值」。

**Architecture:** 一課一檔 Markdown，frontmatter（title/excerpt/tags/status:draft）+ 正文。沿用全站房規：hook 開場 → 方法 → 範例 → 收尾「帶得走」。全部 draft，本地，本階段不 seed、不發布。

**Tech Stack:** Markdown；本地預覽 `node scripts/preview-course.mjs`（如支援指定目錄）。無程式碼、無測試。

**寫作鐵律（每篇都適用）：**
- 觀念 + 大量原創實例，不靠程式碼
- 不照抄參考材料、不點名來源書名/作者（當通用知識寫）
- 繁中全形標點（跳過 frontmatter / inline code）
- bold 後接中文加空格；不用 `{#anchor}` 語法
- 實例題材可用部落格慣用情境（API 金鑰、重設密碼、訂單查詢、修改地址），但敘述原創

---

## Task 0: README

**Files:**
- Create: `docs/course-test-design/README.md`

- [ ] **Step 1: 寫 README**

沿用 bughunt README 結構：標題 + 一段定位 blockquote + 「課程定位」bullet + 「與其他課的交叉」表 + 「課綱（13 課 / 5 模組）」。內容取自 spec `docs/superpowers/specs/2026-06-22-course-test-design-design.md`。主線問句要明寫：「這樣設計，最少資源換到最大測試價值嗎？」

- [ ] **Step 2: Commit**

```bash
git add docs/course-test-design/README.md
git commit -m "docs(course-test-design): README 課綱與定位"
```

---

## 每篇文章的通用步驟模板

每個 Task（A01–E13）都走這四步，不再重複列出：

1. **寫檔**：建立 `docs/course-test-design/article-XXNN-slug.md`，含 frontmatter（title / excerpt / tags / `status: draft`）+ 正文。正文照 hook→方法→範例→收尾，套用該 Task 列出的「重點」與「原創範例」。
2. **自檢**：讀一遍，確認標點全形、無照抄、有具體範例、收尾能「帶得走」。
3. **預覽（可選）**：`node scripts/preview-course.mjs` 看渲染。
4. **Commit**：`git add <該檔> && git commit -m "docs(course-test-design): XXNN <短標>"`

---

## 模組 A · 概念地基

### Task A01: 什麼是「好的」測試案例
**File:** `article-A01-good-test-case.md`
- 重點：好 case 三性質——可讀（別人接手看得懂）、可執行（步驟與預期明確、可照表操課）、抓得到 bug（有目的、不是流水帳）。對比一個爛 case vs 好 case。
- 原創範例：同一個「登入」功能，寫一版含糊 case（「測登入」）vs 一版好 case（前置/步驟/明確預期）。
- 收尾：好 case 的檢核問句清單。

### Task A02: Case / Scenario / Strategy / Plan 差在哪
**File:** `article-A02-case-scenario-strategy-plan.md`
- 重點：四層由大到小——策略（整體怎麼測的方針）、計畫（這次要涵蓋什麼範圍）、情境（要驗證的工作流，廣）、案例（具體步驟+預期，細）。包含關係：策略 ⊃ 計畫 ⊃ 情境 ⊃ 案例。提醒：敏捷下別過度文件化，少即是多。
- 原創範例：以「使用者註冊」一路拆——策略一句、計畫範圍、情境（驗證可建帳號）、案例（用未使用 email 建帳號 / 用已用 email 被擋）。

### Task A03: 最少資源最大價值（主線總綱）
**File:** `article-A03-max-value-min-resource.md`
- 重點：測不完是常態；設計的本質是取捨。價值 = 風險 × 覆蓋到的可能性；成本 = 設計+執行+維護。本篇立下全課主線問句，後面每招都回來問它。
- 原創範例：一個有 200 種輸入組合的表單，示意「全測」vs「挑高風險 20 組」的成本/價值對比。
- 內鏈：可選連既有文 risk-based-testing-max-value。

---

## 模組 B · 從需求挖（範例規格）

### Task B04: 用範例釐清需求·劇本三件套
**File:** `article-B04-examples-clarify-requirements.md`
- 重點：用具體範例澄清需求、建立團隊共識。範例三元素——上下文（系統當前狀態/前置）、觸發行動（誰做什麼）、預期結果（可觀察、可確認的系統行為，含畫面反饋+背景動作如寫 DB/audit log）。
- 原創範例：產生 API 金鑰功能，完整寫出三件套（已登入在金鑰頁→點產生→顯示金鑰+提示+背景寫庫與 audit log）。再給一個重設密碼的三件套。

### Task B05: 範例資料的最小必要集
**File:** `article-B05-minimal-example-data.md`
- 重點：不是資料越多越好。原則：只列「會影響你要表達的行為/邏輯」的資料。多餘欄位讓討論失焦、增加準備成本。
- 原創範例：「修改送貨地址」——有人塞商品明細/身分證/信用卡/原地址…引導者收斂到只需「訂單編號 + 新地址」。再給「下載發票 vs 取消訂單」對比：同情境不同行動，所需資料不同（下載要訂單編號/發票號；取消要訂單編號/訂單狀態）。

### Task B06: 多少範例才夠（釐清 ≠ 覆蓋）
**File:** `article-B06-how-many-examples.md`
- 重點：範例目的是釐清需求、探索邏輯與邊界，不是測試覆蓋。共識夠清楚就可以停。警訊：當對話開始「空字串呢？特殊符號呢？超長呢？先加再刪再改呢？」——已滑進測試腦全覆蓋模式，那是後面測試設計的事，不是這裡。引導者該把焦點拉回「行為的意圖與邏輯」。
- 原創範例：一段需求討論逐字稿，標出哪句是釐清、哪句已滑進測試腦。

---

## 模組 C · 設計技巧工具箱

### Task C07: 等價劃分 + 邊界值
**File:** `article-C07-equivalence-boundary.md`
- 重點：等價劃分把無限輸入分成「行為相同」的類別，每類挑一個代表；邊界值專打類別邊緣（min-1/min/min+1…），因為 bug 最愛躲在邊界。人腦最容易漏邊界，這是高 CP 值基本功。
- 原創範例：年齡欄位允許 18–65——劃出無效/有效類別 + 邊界值（17/18/65/66），算出用幾個值就覆蓋。

### Task C08: 決策表
**File:** `article-C08-decision-table.md`
- 重點：多條件交互的邏輯（巢狀 if-else）用決策表列出條件組合對應結果，確保不遺漏。會員等級×優惠券×金額之類。
- 原創範例：運費規則（會員/非會員 × 滿額/未滿額）畫成決策表，標出每組預期運費，示意如何砍掉不可能組合。

### Task C09: 狀態轉換
**File:** `article-C09-state-transition.md`
- 重點：有生命週期/流程的對象（訂單、帳號、訂閱）用狀態轉換圖+表，測「合法轉換」與「非法轉換被擋」。
- 原創範例：訂單狀態（待付款→已付款→出貨→完成；可取消的條件）。畫狀態圖，列合法/非法轉換各幾條。

### Task C10: 組合爆炸與 pairwise
**File:** `article-C10-pairwise.md`
- 重點：多參數時全組合會爆炸（爆炸數學示意）；多數 bug 由「兩個因子交互」引起，pairwise（兩兩覆蓋）能用極少組合涵蓋所有成對組合。觀念示意 PICT 概念但不教安裝操作。
- 原創範例：OS(3)×瀏覽器(3)×語系(3)×方案(2)=54 全組合 → pairwise 壓到約 9–10 組，說明覆蓋了什麼、放棄了什麼。

---

## 模組 D · 取捨與優先級

### Task D11: 風險導向 + 何時可以停
**File:** `article-D11-risk-based-when-to-stop.md`
- 重點：把有限時間花在「會痛」的地方——風險 = 發生機率 × 影響。高風險深測、低風險抽測。何時停：覆蓋了主要風險、邊際價值遞減、共識夠清楚就收手。呼應 A03 主線。
- 原創範例：一個版本要測的功能清單，標機率×影響打分，排出測試順序與「這次不測」的取捨。

---

## 模組 E · AI 放大

### Task E12: 用 AI 放大測試設計
**File:** `article-E12-ai-amplify-design.md`
- 重點：AI 是放大器，把前面學的方法論餵給它效果最好。場景：澄清需求漏洞（開工前攔截）、邊界/等價窮舉、產決策表、生成髒資料（格式錯誤/超長/emoji/SQL 關鍵字）、舊 case 健檢（找冗餘步驟/含糊預期）。重點是「用方法論引導 AI」，不是叫它「幫我寫測試」。
- 原創範例：給一段需求，示意一個「引導式」prompt（要求用邊界值+等價、列極端值與無效輸入）vs 一個爛 prompt，比較產出。

### Task E13: AI 的陷阱
**File:** `article-E13-ai-pitfalls.md`
- 重點：AI 預設只給 happy path、會幻覺出不存在的需求、產出量大造成「覆蓋假象」（看起來很多其實重複）。為何仍需要你：判斷哪些有價值、對齊真實風險、補領域知識。AI 讓你從「寫文件的機器」變「設計測試的架構師」。
- 原創範例：一段 AI 產出的 case 清單，標出哪些是幻覺/重複/缺邊界，示範人工收斂。
- 收尾：整門課回扣主線——工具再強，取捨還是你的事。

---

## Self-Review（已檢）

- **Spec coverage**：README + A01–E13 對齊 spec 全部 13 課與 5 模組；寫作約束、分工表、主線問句皆入計畫。
- **Placeholder**：無 TBD；每篇列出具體重點 + 原創範例方向（內容創作型計畫，範例為方向指引而非逐字稿）。
- **一致性**：檔名前綴 A01–E13 與 spec 一致；frontmatter 欄位與既有課一致（title/excerpt/tags/status:draft）。
