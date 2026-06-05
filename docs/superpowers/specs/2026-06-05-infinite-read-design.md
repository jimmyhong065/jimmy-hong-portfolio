# Infinite Read — Design Spec

Date: 2026-06-05

## Overview

Mobile-only "endless reading" experience on article pages. When the user scrolls to the bottom of an article, the next most-related article is silently appended below it — no navigation required. URL updates as the user reads each article. Continues until no more related articles remain.

---

## Scope

- **Mobile only** (`md:hidden` wrapper on appended articles' extra UI; feature guard in hook)
- **Desktop unchanged** — existing RelatedPosts grid stays as-is
- Works inside `src/pages/BlogPost.jsx` and a new `src/hooks/useInfiniteRead.js`

---

## Data Layer

### Hook: `useInfiniteRead`

```js
// src/hooks/useInfiniteRead.js
useInfiniteRead(currentTags: string[], initialSlug: string)
→ { fetchNext(): Promise<Post | null> }
```

**Logic:**
1. Maintains `seenSlugs: Set<string>` (initialised with `initialSlug`).
2. On `fetchNext()`:
   - Queries Supabase: `select('*').eq('published', true)` — all published posts.
   - Scores each post: `score = tags.filter(t => currentTags.includes(t)).length`.
   - Filters out `seenSlugs` and posts with `score === 0`.
   - Sorts by `score DESC`.
   - Returns the top result, or `null` if none remain.
   - Adds returned slug to `seenSlugs`.
3. `fetchNext()` is safe to call concurrently — a `loadingRef` flag prevents double-fetches.

**Note:** `currentTags` is the tags of the **original** article (the one the user navigated to), not the dynamically visible one. This keeps the recommendation set stable across the session.

---

## State in BlogPost

```js
const [extraArticles, setExtraArticles] = useState([])  // appended Post[]
const [loadingNext, setLoadingNext] = useState(false)
const [exhausted, setExhausted] = useState(false)       // no more related
const { fetchNext } = useInfiniteRead(post?.tags ?? [], slug)
```

`extraArticles` is the ordered list of appended posts. Initial article is NOT in this array.

---

## Sentinel & IntersectionObserver

At the bottom of each article (initial + appended), place:

```jsx
<div ref={sentinelRef} className="md:hidden" aria-hidden="true" />
```

One `IntersectionObserver` watches **all** sentinels. When the last sentinel enters viewport (threshold 0.1):

```js
if (!loadingNext && !exhausted) {
  setLoadingNext(true)
  const next = await fetchNext()
  if (next) setExtraArticles(prev => [...prev, next])
  else setExhausted(true)
  setLoadingNext(false)
}
```

Implementation: use a single ref array (`sentinelRefs`) tracking one sentinel per article. The observer is re-initialised (or uses `observe()`) whenever `extraArticles` changes.

---

## URL Update

Each article section (initial + appended) is wrapped in:

```jsx
<article data-slug={article.slug}>...</article>
```

A separate `IntersectionObserver` watches all `[data-slug]` elements at `threshold: 0.5`. When an article occupies >50% of the viewport:

```js
window.history.replaceState(null, '', `/blog/${slug}`)
```

This does NOT trigger React re-renders — it's a browser history mutation only.

---

## Rendered Structure (mobile)

```
<article data-slug="article-a">
  ← 返回     (mobile back button)
  [tags]
  [H1 title]
  [date · reading time]
  [content]
  [share bar]     ← only on first article
  [email form]    ← only on first article
  <div ref={sentinel-0} />   ← invisible trigger
</article>

── 下一篇 ──
[Next article title]
─────────────

<article data-slug="article-b">
  [tags]
  [H1 title]
  [date · reading time]
  [content]
  <div ref={sentinel-1} />
</article>

...

── 已讀完所有相關文章 ──   (when exhausted)
```

**Appended articles omit:** email subscribe form, share bar, RelatedPosts grid, SeriesNav.

**Appended articles include:** back button (mobile), tags (clickable), title, date/reading time, full markdown content, ArticleToolbar bookmark (tracked by visible slug).

---

## ArticleToolbar — Active Slug

The `ArticleToolbar` bookmark button must know which article is currently visible.

Add `activeSlug` state in `BlogPost`:

```js
const [activeSlug, setActiveSlug] = useState(slug)
```

The URL-tracking `IntersectionObserver` (§ URL Update) also calls `setActiveSlug(slug)` when an article enters view.

Pass `activeSlug` to the toolbar:
```jsx
<ArticleToolbar
  bookmarked={isBookmarked(activeSlug)}
  onToggleBookmark={() => toggle(activeSlug)}
  ...
/>
```

---

## Loading State

While `loadingNext === true`, show below the last sentinel:

```jsx
<div className="md:hidden flex justify-center py-12">
  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
</div>
```

---

## End State

When `exhausted === true`, show below the last article:

```jsx
<p className="md:hidden text-center text-xs text-gray-400 py-12">
  — 已讀完所有相關文章 —
</p>
```

---

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Article has no tags | `fetchNext()` returns `null` immediately → `exhausted = true` |
| Only 1 published article | Same as above |
| User returns to page via back button | `extraArticles` resets (normal React unmount) |
| Dark mode active | Appended articles inherit `dark` state from BlogPost |
| Font size changes | `fontSize` state shared — all articles change together |
| Desktop | `md:hidden` on sentinel; feature never triggers |

---

## Files Changed

| File | Action |
|---|---|
| `src/hooks/useInfiniteRead.js` | Create |
| `src/pages/BlogPost.jsx` | Add state, sentinels, observers, appended article rendering |
