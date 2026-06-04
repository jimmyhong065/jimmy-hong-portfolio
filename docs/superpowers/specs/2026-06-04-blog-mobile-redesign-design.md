# Blog 手機閱讀體驗改版 — Design Spec

**Date:** 2026-06-04  
**Scope:** `/blog` 文章列表頁，手機體驗優化（桌機現有版面不變）

---

## Goals

1. Tag filter 改為單行橫向捲動 pill bar
2. 文章列表在手機改為有摘要的卡片（`BlogCard`）
3. 分頁在手機改為「載入更多」按鈕

桌機版（`md+`）維持現有 `BlogRow` + 數字分頁，完全不動。

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/components/BlogCard.jsx` | 手機卡片元件（title + excerpt + tags + date） |

### Modified Files

| File | Change |
|------|--------|
| `src/components/TagFilter.jsx` | 橫向捲動 pill bar + 邊緣漸層 fade |
| `src/pages/Blog.jsx` | 手機用 BlogCard + Load More；桌機保留 BlogRow + 數字分頁 |

---

## Feature Details

### 1. TagFilter — 橫向捲動

- 外層 `div` 加 `relative` 包住左右漸層
- 捲動區 `overflow-x: auto scrollbar-hide flex flex-nowrap gap-2 pb-2`
- 左漸層：`absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none`
- 右漸層：`absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none`
- 按鈕改 `rounded-full px-4 py-1.5 flex-shrink-0`
- 選中態維持 `bg-gray-900 text-white`，未選 `bg-white text-gray-500 border-gray-200`

### 2. BlogCard — 手機文章卡片

```
┌─────────────────────────────────────┐
│  [tag1]  [tag2]  [tag3]             │
│                                     │
│  文章標題（bold, 15px）              │
│  文章標題第二行                      │
│                                     │
│  摘要文字第一行…                     │
│  摘要文字第二行（line-clamp-2）      │
│                                     │
│  2026-06-04                          │
└─────────────────────────────────────┘
```

**Props:** `post` (同 BlogRow 相同欄位：id, title, slug, excerpt, tags, published_at)

**Tag 顯示：** 前 3 個，超過不顯示（不捲動）

**閱讀時間：** 不顯示（`usePosts` 不 fetch `content`，無法計算）

**樣式：**
- 外層 Link：`block rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 hover:shadow-md transition-shadow`
- Tags：`flex gap-1 mb-2` → `text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full`
- Title：`text-sm font-semibold text-gray-900 leading-snug mb-1`
- Excerpt：`text-xs text-gray-500 line-clamp-2 mb-3`
- Footer：`text-xs text-gray-400`（只顯示日期）

### 3. Blog.jsx — 手機/桌機分流

**文章列表：**
```jsx
{/* 手機：卡片 */}
<div className="md:hidden">
  {pagedMobile.map(p => <BlogCard key={p.id} post={p} />)}
</div>
{/* 桌機：row */}
<div className="hidden md:block">
  {paged.map(p => <BlogRow key={p.id} post={p} />)}
</div>
```

**手機分頁狀態：**
- `visibleCount` state，初始 `PAGE_SIZE`（12）
- `pagedMobile = filtered.slice(0, visibleCount)`
- filter / tag / query 變更時 `useEffect` reset `visibleCount = PAGE_SIZE`
- 「載入更多」按鈕：`visibleCount < filtered.length` 時顯示
- 按鈕全寬，`w-full py-3 mt-6 text-sm border border-gray-200 rounded-xl`

**桌機分頁：** 現有 `page` state 和數字分頁邏輯不動，包在 `hidden md:flex` 內

---

## Out of Scope

- 桌機版重新設計
- Tag 排序或分組
- 搜尋 UI 改版
- 無限捲動（Intersection Observer）
- 動畫 / transition between pages
