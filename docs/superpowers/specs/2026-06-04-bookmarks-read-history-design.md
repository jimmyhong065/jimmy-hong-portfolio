# Bookmarks & Read History — Design Spec

Date: 2026-06-04

## Overview

Add localStorage-based bookmarking and read-tracking to the blog. No login required. Users can bookmark articles while reading, track which articles they've already read, filter the blog listing by unread or bookmarked, and access a dedicated `/saved` page from the mobile bottom nav.

---

## Data Layer

### Storage

| Key | Type | Description |
|-----|------|-------------|
| `blog-bookmarks` | `string[]` (JSON) | Slugs of bookmarked articles |
| `blog-read-history` | `string[]` (JSON) | Slugs of articles read ≥80% |

Both keys are read/written via `localStorage`. No Supabase writes.

### `useBookmarks` hook

```js
// src/hooks/useBookmarks.js
useBookmarks() → {
  bookmarks: string[],
  toggle(slug: string): void,   // adds if absent, removes if present
  isBookmarked(slug: string): bool
}
```

Initialises from `localStorage` on mount. Writes back on every toggle.

### `useReadHistory` hook

```js
// src/hooks/useReadHistory.js
useReadHistory() → {
  isRead(slug: string): bool,
  markRead(slug: string): void   // idempotent — no-op if already read
}
```

Internally stores as `Set<string>` for O(1) lookups. Persists as JSON array.

---

## Auto-Read Trigger

In `BlogPost.jsx`:

- Import `useReadHistory` and `useReadingProgress` (already present).
- Add a `useRef` flag (`markedRef`) to prevent duplicate writes.
- In a `useEffect` watching `progress`: when `progress >= 80 && !markedRef.current`, call `markRead(slug)` and set `markedRef.current = true`.

---

## ArticleToolbar Changes

File: `src/components/ArticleToolbar.jsx`

Add a bookmark toggle button between A+ and the dark-mode button:

```
[ A− | 16px | A+ ]          [ 🔖 ]   [ 🌙 ]
```

- `🔖` outline (gray) = not bookmarked
- `🔖` filled (black/dark-gold) = bookmarked
- Tap toggles via `useBookmarks().toggle(slug)`
- `slug` passed as a new prop to `ArticleToolbar`

---

## BlogCard Changes

File: `src/components/BlogCard.jsx`

- Accept `isRead` bool prop.
- When `isRead === true`: show a small `✓` badge (gray, `text-[10px]`, top-left corner of card), and apply subtle opacity (`opacity-70`) to the card to visually de-emphasise read articles.

---

## Blog Listing Changes

File: `src/pages/Blog.jsx`

### Filter Pills

Add two fixed pills at the left of `TagFilter`, separated from tag pills by a thin `|` divider:

```
[全部]  [未讀]  [收藏]  |  標籤A  標籤B  ...
```

Implementation: `TagFilter` receives a new `specialFilters` prop (array of `{key, label}`) rendered before the `|` divider. The existing tag-selection logic is unchanged.

- `全部`: clear both special filter and tag filter
- `未讀`: show only `!isRead(slug)`, tag filter still applicable
- `收藏`: show only `isBookmarked(slug)`, tag filter still applicable
- Special filter and tag filter combine with AND logic.

### Read/Bookmark data

`Blog.jsx` calls both `useBookmarks()` and `useReadHistory()` and passes `isRead` down to each `BlogCard`.

---

## Saved Page

File: `src/pages/Saved.jsx` (new)

Route: `/saved`

Behaviour:
1. Read `bookmarks` from `useBookmarks()`.
2. If empty: show illustration + "還沒有收藏的文章，在閱讀時點 🔖 加入".
3. If non-empty: batch-fetch from Supabase — `select('*').in('slug', bookmarks).eq('published', true)`.
4. Render fetched articles as `BlogCard` list (same as Blog page), sorted by `published_at` desc.
5. Each card shows `isRead` indicator.

Loading state: same skeleton/spinner pattern as Blog page.

---

## Bottom Nav Changes

File: `src/components/Nav.jsx`

Replace the `合作方式` tab with `收藏`:

| Old | New |
|-----|-----|
| 合作方式 → `/services` | 收藏 → `/saved` |

Icon: ★ (filled star or bookmark SVG, consistent with existing tab icon style).

---

## App Router

File: `src/App.jsx`

Add route:
```jsx
<Route path="/saved" element={<Saved />} />
```

No auth guard — page is public but content is local to the device.

---

## Files Changed / Created

| File | Action |
|------|--------|
| `src/hooks/useBookmarks.js` | Create |
| `src/hooks/useReadHistory.js` | Create |
| `src/components/ArticleToolbar.jsx` | Add bookmark button + `slug` prop |
| `src/pages/BlogPost.jsx` | Wire auto-read trigger + pass `slug` to toolbar |
| `src/components/BlogCard.jsx` | Add `isRead` prop + visual indicator |
| `src/pages/Blog.jsx` | Add special filter pills + read/bookmark hooks |
| `src/pages/Saved.jsx` | Create |
| `src/components/Nav.jsx` | Replace 合作方式 with 收藏 |
| `src/App.jsx` | Add `/saved` route |
