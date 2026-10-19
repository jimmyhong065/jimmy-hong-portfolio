# QA Lens — GEO 規劃文件

**目標：** 讓 AI 搜尋引擎（Perplexity、ChatGPT、Claude、Gemini）在回答 QA 相關問題時，能夠引用 qa-lens.com 的文章。

**現況（2026-06）：**
- 38 篇已發布文章
- Google 收錄：0 篇（qa-lens.com 剛換域名）
- llms.txt：已建置
- robots.txt：已允許所有 AI 爬蟲
- JSON-LD BlogPosting schema：已建置

---

## Phase 1 — 讓 Google 找到你（Week 1~2）

**目的：** AI 搜尋工具（Perplexity、ChatGPT with search）90% 靠 Google index 作為知識來源。沒有 Google 收錄 = AI 不知道你存在。

### 技術面（已完成）
- [x] sitemap.xml 提交 Google Search Console
- [x] llms.txt 建置（`qa-lens.com/llms.txt`）
- [x] robots.txt 明確允許 AI 爬蟲
- [x] BlogPosting schema + wordCount + inLanguage

### 手動提交（待做）
- [ ] Google Search Console → URL Inspection → 逐篇「Request Indexing」
  - 優先順序：最近 10 篇新文章先做
  - 每次 Search Console 提交上限約 10 篇，分批處理

### 驗收指標
- `site:qa-lens.com` Google 搜尋出現結果
- Search Console Coverage 顯示 indexed 頁數 > 0

---

## Phase 2 — 建立反向連結（Week 2~4）

**目的：** 新域名沒有外部連結，Googlebot 爬取優先級極低。外部高品質連結 = 加速爬取、提升 PageRank。

### 優先平台（台灣）

| 平台 | 理由 | 做法 |
|------|------|------|
| **iThome IT邦幫忙** | Google 幾小時內爬取，台灣工程師最大聚集地 | 發 3~5 篇文章摘要，末尾加原文連結 |
| **PTT Soft_Job / Tech_Job** | Google 有收錄，IT 社群流量大 | 分享文章觀點，帶連結 |
| **LinkedIn** | LinkedInBot 爬 → Google 跟爬，職場能見度 | 每篇文章發一則貼文摘要 |
| **GitHub README** | Google 信任 GitHub 高，爬取快 | 個人 repo 或筆記 repo 加 qa-lens.com 連結 |

### 優先推廣文章（話題性強、搜尋量大）
1. `appium-article-revised` — Appium CI 實戰
2. `k6-article-revised` — k6 效能測試
3. `tau-github-actions-for-testing` — GitHub Actions
4. `ai-replaced-qa-6m-loss` — AI 取代 QA 話題
5. `testing-ai-generated-code` — AI 寫的 code 怎麼測

### 驗收指標
- iThome 文章帶連結上線
- LinkedIn 貼文各獲 > 10 互動
- `site:qa-lens.com` 收錄篇數持續成長

---

## Phase 3 — 內容可引用性優化（持續）

**目的：** AI 工具偏好引用「直接回答問題」的段落，而非長篇論述。

### 文章結構調整原則

**每篇文章應有：**
- **開頭摘要段落**（2~3 句）：直接回答「這篇文章解決什麼問題」
  - 範例：「Appium 測試在 CI 環境下常因裝置不穩定而失效。本文介紹 Self-Healing 機制，讓定位器斷掉時自動修復，降低維護成本。」
- **明確的 H2/H3 問句標題**
  - 改前：「背景介紹」
  - 改後：「為什麼 Appium 測試在 CI 上容易失敗？」
- **定義段落**：提到專有名詞時，先一句話定義
  - 範例：「Self-Healing 是指測試框架在元素找不到時，自動嘗試備用定位策略的機制。」
- **具體數字或結論句**：AI 喜歡引用有數字的句子
  - 範例：「導入後 CI 失敗率從 35% 降至 8%」

### 新增 FAQ section（高優先文章）
在文章末尾加一段「常見問題」，格式：
```
## 常見問題

**Q：Appium 和 Espresso 有什麼差別？**
A：Appium 跨平台（iOS/Android），Espresso 只支援 Android 但速度更快、穩定性更高。選擇依測試目標而定。

**Q：Self-Healing 會不會遮蓋真正的定位器問題？**
A：會。建議設 Alert 通知，修復後需追蹤原始 selector 是否需更新。
```

### 驗收指標
- 每篇文章開頭有摘要段落
- 重點文章有 FAQ section
- Perplexity 搜尋相關問題時出現 qa-lens.com 來源

---

## Phase 4 — AI 平台直接登錄（Week 3~4）

**目的：** 除 Google 管道外，直接讓 AI 工具知道你的存在。

| 平台 | 動作 |
|------|------|
| **llmstxt.directory** | 至 `directory.llmstxt.cloud` 登錄 qa-lens.com/llms.txt |
| **Perplexity** | 右上角 Submit URL，提交 `qa-lens.com/llms.txt` 和重點文章 URL |
| **Bing Webmaster Tools** | 提交 sitemap（Bing index = Copilot 知識來源） |
| **IndexNow** | 每次發新文章自動 ping Bing/Yandex（可寫 CF Function） |

---

## Phase 5 — 持續發布與更新策略（Month 2+）

**目的：** Google 對「持續更新」的網站爬取頻率更高，AI 工具引用「近期資訊」機率更高。

### 發布節奏
- 目標：每 2 週 1 篇新文章
- 優先主題（搜尋量高）：
  - AI + QA 結合（ChatGPT 時代的測試策略）
  - 具體工具教學（pytest、Playwright、k6）
  - 台灣職場 QA 議題（面試、升遷、與 PM 協作）

### 舊文章更新
- 每季更新 5 篇舊文章的「最後更新時間」和內容
- Google 對 `dateModified` 近期的頁面給予更高爬取優先級

### 內部連結優化
- 每篇新文章至少連結 2~3 篇舊文章
- 建立「系列文」標籤強化主題群（Topic Cluster）

---

## 追蹤指標儀表板

| 指標 | 目前 | 1 個月目標 | 3 個月目標 |
|------|------|------------|------------|
| Google 收錄篇數 | 0 | 15+ | 35+ |
| Perplexity 引用次數 | 0 | 3+ | 10+ |
| 每月 organic 流量 | 不明 | 100+ | 500+ |
| 外部反向連結數 | 0 | 5+ | 20+ |
| llms.txt 登錄狀態 | 未登錄 | 已登錄 | 已登錄 |

---

## 優先順序（本週行動清單）

- [ ] **Day 1：** Google Search Console 提交前 10 篇文章 URL（Request Indexing）
- [ ] **Day 2：** iThome IT邦幫忙 發第一篇文章摘要（選 appium 或 k6）
- [ ] **Day 3：** LinkedIn 發 3 篇文章貼文
- [ ] **Day 4：** Bing Webmaster Tools 提交 sitemap
- [ ] **Day 5：** llmstxt.directory 登錄
- [ ] **Week 2：** 選 5 篇高優先文章加 FAQ section
- [ ] **Week 2：** 提交剩餘 28 篇文章到 Search Console
