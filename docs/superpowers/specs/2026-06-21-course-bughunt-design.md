# 新課設計：QA 抓蟲實戰 — 找得到、釘得死、追得到底

**Date:** 2026-06-21
**Status:** Approved outline, ready for implementation plan
**課程目錄:** `docs/course-bughunt/`

## 定位

抓蟲是科學，不是運氣。測試工程師最核心的硬實力 = 把 bug 找出來（破壞性思維）、
釘死（重現的科學方法）、追到修好（協調與追蹤）。課程順著一隻 bug 的一生編排：
**找 → 釘 → 關**。

與既有「溝通課」「品質課」互補：那兩課從**溝通／管理視角**談 bug 報告與分級，
本課從**craft／方法視角**談——破壞性測試怎麼設計、重現怎麼科學化、缺陷怎麼判斷與追蹤。

## 教學哲學（與既有課一致）

- 每篇 hook 開場、有方法、有範例、收尾「帶得走」。
- 不寫成 tips 清單；每課給可操作的方法論。
- 繁中全形標點。
- **不掛來源書名/作者**，當通用知識寫（內部參考骨架見文末，不入正文）。
- QA IC 講師視角。
- 全 draft（本地）。一課一檔 `article-Axx/Bxx/Cxx-*.md`。

## 課綱（9 課 / 3 模組）

### 模組 A · 破壞性思維（怎麼找到 bug）

- **A01 逆向思維：從「它能動」到「我要弄壞它」**
  為什麼破壞性測試是高階能力。正向 vs 逆向思維、從失敗場景倒推、質疑「使用者會乖乖照流程走」的假定。
- **A02 攻擊維度地圖：系統有哪些面可以打**
  用 SFDPOT（結構/功能/資料/平台/操作/時間）當維度地圖，搭配具體手法：瘋狂操作（連點防重複）、
  資源中斷（斷網/飛航模式驗證資料一致性）、髒資料注入（負值/超長/型態錯誤/注入字串）、併發競態（雙分頁防超賣）。
- **A03 怎麼認得「這是 bug」：一致性判準**
  破壞之後要會辨識異常。用 FEW HICCUPPS 概念講「產品該與什麼一致」（歷史行為、可比產品、使用者期待、
  規格、合理性），把「我覺得怪怪的」變成可說明的判準。

### 模組 B · 重現與報告（怎麼釘死 bug）

- **B04 重現是科學方法：控制變數與最小重現**
  控制變數法（一次只改一個條件）、邊界值分析（0/max/max+1）、最小重現步驟（10 步削到 3 步）——
  用 Minimal Reproducible Example 的削減法落地。
- **B05 偶發 bug 怎麼抓**
  重現率分類（100% 必現 / 5-10 偶發 / 難重現）、日誌判讀（Console / Server Log / 500 錯誤訊息）、
  變數隔離。點出偶發 bug 常見成因（環境、時序、併發、外部相依、資料狀態）。
- **B06 寫一份 RD 一分鐘看懂的缺陷報告**
  報告結構：標題（在哪裡/做什麼/發生什麼）、嚴重度、環境、前置條件、重現步驟、預期 vs 實際、佐證。
  客觀描述（不用「很奇怪」）、附證據（錄影/截圖/Network/Stack Trace/Request ID）。
  **與溝通課 C09 分工**：本課講報告的**結構與證據邏輯**；C09 講**措辭與口氣**。

### 模組 C · 協調與追蹤（怎麼讓 bug 被修）

- **C07 釐清異常：把 bug 交對人**
  前後端區分（DevTools Network 判前端渲染 vs API 回傳）、排除環境汙染（快取/測試資料/環境不穩造成的偽 bug）、
  對事不對人的溝通（描述現象不評判能力）。
- **C08 缺陷分級：Severity 不等於 Priority**
  **核心修正點**：Severity（技術影響、客觀、QA 定）vs Priority（業務急迫、主觀、PM 定）。
  高 Severity 低 Priority 的實例、P0–P2 怎麼分、跟 PM 對齊業務目標、Known Issue 的取捨。
  **與品質課 E05 分工**：本課講**QA 怎麼判斷分級**；E05 從**管理/指標視角**。
- **C09 驗證修復與回歸：別只測那一個點**
  缺陷生命週期 New→Assigned→Open→Fixed→Retest→Closed（跳過 Retest 會放掉回歸逃逸）。
  漣漪效應、波及範圍評估（改了購物車計算 → 連帶測折價券/免運門檻）、問 RD「改了哪段」。

## 與既有課交叉（內鏈，不重複內容）

| 本課 | 連到 | 分工 |
|---|---|---|
| B06 缺陷報告結構 | 溝通課 C09 回報 bug | 本課=結構/證據；C09=措辭/口氣 |
| C07 釐清異常、對事不對人 | 溝通課 C10 向上/跨團隊 | 本課=判斷方法；C10=怎麼說 |
| C08 缺陷分級 | 品質課 E05 缺陷分級 | 本課=QA 判斷；E05=管理/指標 |
| A02 攻擊維度、髒資料 | （未來）安全測試章節 | 注入類攻擊的測試入口 |

## 內部參考骨架（不入正文，只當作者寫作依據）

| 模組 | 參考 |
|---|---|
| A | Rapid Software Testing（Bach/Bolton）探索式測試；Heuristic Test Strategy Model；SFDPOT；FEW HICCUPPS；邊界值/等價分割 |
| B | Minimal Reproducible Example（削減法）；「Ten simple rules for reporting a bug」(PLOS)；arXiv「Why are Some Bugs Non-Reproducible」（偶發 bug 實證成因） |
| C | Severity vs Priority（QA 定 severity、PM 定 priority）；缺陷生命週期 6 階段；缺陷 triage；回歸/漣漪效應 |

來源連結（供作者查證，不入正文）：
- https://www.satisfice.com/rapid-testing-methodology
- https://www.satisfice.com/download/heuristic-test-strategy-model
- https://developsense.com/blog/2012/07/few-hiccupps
- https://en.wikipedia.org/wiki/Minimal_reproducible_example
- https://journals.plos.org/ploscompbiol/article?id=10.1371%2Fjournal.pcbi.1010540
- https://arxiv.org/pdf/2108.05316
- https://www.guru99.com/defect-severity-in-software-testing.html
- https://yrkan.com/blog/defect-life-cycle/

## 交付物

- `docs/course-bughunt/README.md` — 課程定位、教學哲學、課綱、交叉表（對齊既有 course README 格式）。
- `docs/course-bughunt/article-A01-reverse-thinking.md`
- `docs/course-bughunt/article-A02-attack-dimensions.md`
- `docs/course-bughunt/article-A03-consistency-oracles.md`
- `docs/course-bughunt/article-B04-scientific-reproduction.md`
- `docs/course-bughunt/article-B05-flaky-bugs.md`
- `docs/course-bughunt/article-B06-defect-report.md`
- `docs/course-bughunt/article-C07-clarify-anomaly.md`
- `docs/course-bughunt/article-C08-severity-vs-priority.md`
- `docs/course-bughunt/article-C09-verify-and-regression.md`

每篇 frontmatter：`title`、`excerpt`、`tags`、`status: draft`。

## 不在本次範圍（follow-up）

- 上線到 Supabase / 設 published（沿用既有 seed/upload 流程，另行處理）。
- 後台課程封面、章節封面。
- 跨課內鏈的實際 URL 連結（等其他課也上線後再補）。
