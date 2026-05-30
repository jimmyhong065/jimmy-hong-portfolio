# Blog 強化 Roadmap

> 目標：打造一個對 QA 工程師有長期價值的技術部落格，透過 SEO 帶來自然流量、RSS 建立忠實讀者、互動功能提升留存。

---

## Phase 1 — 流量基礎（SEO）

> **為什麼先做：** 現在已有 49 篇文章，但 Google 還沒辦法正確索引。每晚一天啟動 SEO，就少一天的複利。

### 1-1. sitemap.xml 動態生成
- 從 Supabase 拉所有 `published: true` 的文章 slug
- 生成 `sitemap.xml` 讓 Google 知道所有頁面
- 部署方式：Cloudflare Pages Function（`/sitemap.xml`）

### 1-2. robots.txt
- 告訴搜尋引擎爬取規則
- 指向 sitemap 位置
- 靜態檔案放 `public/robots.txt`，內容：
  ```
  User-agent: *
  Allow: /
  Sitemap: https://jimmy-hong-portfolio.pages.dev/sitemap.xml
  ```

### 1-3. JSON-LD 結構化資料
- 在每篇文章頁面加 `<script type="application/ld+json">` Article schema
- 讓 Google 顯示 Rich Result（作者、發布日期）

### 預期成果
- 文章開始被 Google 索引（2–4 週）
- 長尾關鍵字帶來自然流量

---

## Phase 2 — 讀者留存

### 2-1. RSS Feed（`/rss.xml`）
- Cloudflare Pages Function 動態生成 RSS 2.0 格式
- 工程師用 Feedly / NetNewsWire 訂閱，是最高質量的讀者
- `<link rel="alternate" type="application/rss+xml">` 加到 `<head>`

### 2-2. 閱讀時間估算
- 計算文章字數 / 300字 per 分鐘（中文閱讀速度）
- 顯示在文章列表和文章頁：「約 8 分鐘」
- 純前端計算，無需後端

### 2-3. Giscus 留言系統
- 基於 GitHub Discussions，完全免費
- QA 工程師都有 GitHub，不需要額外註冊
- 文章底部嵌入，讓讀者留言討論
- 設定：`giscus.app` 取得 config，加一段 script 到文章頁

---

## Phase 3 — 閱讀體驗

### 3-1. 程式碼語法高亮
- TipTap 現在的 code block 沒有語法高亮
- 加 `@tiptap/extension-code-block-lowlight` + `highlight.js`
- 前台 MarkdownContent 也需要處理 HTML 中的 code block

### 3-2. 文章目錄（TOC）
- 解析文章 H2/H3 標題自動生成目錄
- 桌面版顯示在右側固定欄，行動版收折
- 點擊跳到對應段落（anchor link）

### 3-3. og:image 動態生成
- 分享到 LinkedIn / X 時顯示文章標題圖片
- 方案：Cloudflare Workers + `resvg` 或 `satori` 動態生成 PNG
- 或：用 Canva 做一個靜態模板圖

---

## Phase 4 — 長期佈局

### 4-1. Newsletter 訂閱
- 服務選擇：Resend（免費 3000 封/月）或 Buttondown（free tier）
- 文章頁底部加訂閱欄
- 新文章發布時觸發 email 通知

### 4-2. GitHub Actions CI/CD
- Push to main → 自動 `npm run build` + `wrangler pages deploy`
- 目前每次都要手動部署，CI 後完全自動化
- 需要在 GitHub Secrets 加 Cloudflare API Token

### 4-3. 圖片 WebP 自動轉換
- 現在 R2 上傳的是原始格式（JPG/PNG）
- 上傳時加轉換步驟，或用 Cloudflare Image Resizing
- 提升 Core Web Vitals（LCP）

### 4-4. 公開頁面搜尋
- 讓讀者在部落格內搜尋文章
- 方案 A：Cloudflare Vectorize（語意搜尋）
- 方案 B：Supabase Full-Text Search（較簡單）

---

## 優先順序總覽

| 階段 | 項目 | 難度 | 影響 |
|------|------|------|------|
| 1 | sitemap.xml | 低 | 🔴 高 |
| 1 | robots.txt | 極低 | 🔴 高 |
| 1 | JSON-LD | 低 | 🟡 中 |
| 2 | RSS feed | 低 | 🔴 高 |
| 2 | 閱讀時間 | 極低 | 🟡 中 |
| 2 | Giscus 留言 | 低 | 🟡 中 |
| 3 | 程式碼高亮 | 中 | 🟡 中 |
| 3 | 文章目錄 | 中 | 🟡 中 |
| 3 | og:image | 高 | 🟡 中 |
| 4 | Newsletter | 中 | 🟢 長期 |
| 4 | GitHub Actions | 低 | 🟢 長期 |
| 4 | 圖片 WebP | 中 | 🟢 長期 |
| 4 | 公開搜尋 | 高 | 🟢 長期 |

---

## 現況（2026-05-30）

- ✅ WYSIWYG 編輯器（TipTap）
- ✅ Mermaid 圖表支援
- ✅ 後台：搜尋、篩選、批次操作、自動儲存、預覽
- ✅ R2 圖片上傳
- ✅ 49 篇文章（2 已發布 / 47 草稿）
- ✅ Cloudflare Web Analytics
- ⏳ SEO 基礎（Phase 1，建議下一步）
