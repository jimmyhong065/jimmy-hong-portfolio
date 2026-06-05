# Mobile Reading Stickiness — Design Spec

Date: 2026-06-05

## Goal

提升手機用戶閱讀黏著度，兩個方向並行：
1. 閱讀過程更舒適（行距、進度感知）
2. 讀完後更容易繼續看下一篇（相關文章）

## Scope

- `ArticleToolbar.jsx` — 加進度條 + 剩餘時間
- `BlogPost.jsx` — 傳入新 props、加 RelatedArticles
- `RelatedArticles.jsx` — 新 component
- `src/styles/article.css`（或現有 CSS 檔）— prose 行距

桌機不受影響，所有新增 UI 限手機（`md:hidden`）。

---

## Feature 1: ArticleToolbar 進度整合

### 進度條

- 位置：toolbar 頂部，2px 高，全寬
- 顏色：
  - light mode：背景 `#e5e7eb`，填充 `#111827`
  - dark mode：背景 `#374151`，填充 `#9ca3af`
- 數值：使用現有 `progress` state（0–100）

### 剩餘時間 label

- 替換現有 font size px label（`16px` 那個 span）
- 邏輯：
  ```
  progress === 0  → "{readingMin} 分鐘閱讀"
  progress === 100 → "讀完了 ✓"
  else             → "剩 {Math.ceil(readingMin * (1 - progress / 100))} 分鐘"
  ```
- Props 新增：`progress: number`、`readingMin: number`

---

## Feature 2: RelatedArticles Component

### 位置

手機文章頁，分享按鈕區塊之後、上下篇導航之前。`md:hidden`。

### UI 結構

```
你可能也感興趣
─────────────────────────────
🧪  Appium 行動測試實戰
    測試工具  ·  12 分鐘
─────────────────────────────
⚙️  GitHub Actions 自動化測試入門
    CI/CD  ·  8 分鐘
─────────────────────────────
📄  k6 效能測試入門
    效能測試  ·  10 分鐘
```

### 資料查詢

- Supabase query：文章 tags 陣列任一匹配，排除當前 slug
- 排序：`published_at desc`
- 筆數：最多 3 筆
- 無結果：component 回傳 null

### Tag → Emoji Map

| Tag 關鍵字 | Emoji |
|-----------|-------|
| CI/CD、Actions、GitHub | ⚙️ |
| Appium、行動、mobile | 📱 |
| 測試工具、pytest、k6 | 🧪 |
| 效能、performance | ⚡ |
| 其他 / fallback | 📄 |

### Props

```ts
interface RelatedArticlesProps {
  currentSlug: string
  tags: string[]
}
```

---

## Feature 3: Prose 行距優化

檔案：`src/styles/`（現有 CSS）

```css
.article-font-sm .prose p,
.article-font-sm .prose li,
.article-font-md .prose p,
.article-font-md .prose li,
.article-font-lg .prose p,
.article-font-lg .prose li {
  line-height: 1.85;
}

.article-font-sm .prose blockquote,
.article-font-md .prose blockquote,
.article-font-lg .prose blockquote {
  line-height: 1.85;
}
```

---

## Data Flow

```
BlogPost
  ├── progress (existing useScrollProgress)
  ├── readingMin (existing)
  ├── post.tags (existing)
  │
  ├── → ArticleToolbar (progress, readingMin, ...existing props)
  └── → RelatedArticles (currentSlug=slug, tags=post.tags)
            └── supabase.from('posts').select(...)
```

---

## Out of Scope

- 桌機相關文章（側欄已有 ToC，動線不同）
- 程式碼區塊複製按鈕（另立 ticket）
- 字體大小控制 UX 改善（現有 toolbar 維持不動）
