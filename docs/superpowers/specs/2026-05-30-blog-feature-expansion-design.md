# Blog Feature Expansion Design

**Date:** 2026-05-30
**Scope:** 7 features across Admin panel and public-facing BlogPost page

---

## Overview

Three independent batches. Each batch can be implemented and deployed separately.

| Batch | Features | Files affected |
|-------|----------|---------------|
| A | Admin: reading time, article clone, batch tag management | `AdminPosts.jsx` |
| B | BlogPost: reading progress bar, TOC, related articles | `BlogPost.jsx`, `MarkdownContent.jsx`, new components |
| C | RSS feed | `functions/rss.xml.js` (new) |

---

## Batch A — Admin Enhancements

### A1. Reading Time Display

**Where:** `AdminPosts` table — new column between 標籤 and 狀態.

**How:**
- Add `content` to the Supabase select query in `fetchPosts`
- Compute `Math.ceil(content.replace(/\s/g, '').length / 400)` minutes (Chinese reading speed ~400 chars/min)
- Display as `X 分鐘` in gray text
- Column header: `時間`, not sortable initially

**Edge cases:**
- Empty content → show `—`
- Very short posts (<1 min) → show `1 分鐘`

### A2. Article Clone

**Where:** Each row in `AdminPosts` table — add "複製" button next to 編輯/刪除.

**How:**
1. Fetch full post by `id` (need `content` already in state from A1)
2. Insert new draft: `{ title: original.title + '（複製）', slug: original.slug + '-copy-' + Date.now(), content, excerpt, tags, published: false, published_at: null }`
3. On success: navigate to `/admin/posts/<new_id>` for immediate editing

**Edge cases:**
- Slug collision handled by appending `-copy-{timestamp}`
- Clone button triggers immediate navigation, no confirmation needed

### A3. Batch Tag Management

**Where:** Batch action bar (already visible when posts are selected) — append after existing 發布/取消發布/刪除 buttons.

**UI:**
```
[已選 N 篇] [發布] [取消發布] [刪除] | 標籤: [___________] [追加] [取代]
```

**Behavior:**
- Tag input: comma-separated free text (same pattern as existing `AdminPostEdit`)
- **追加**: for each selected post, merge new tags into existing `tags` array (deduplicate)
- **取代**: for each selected post, replace `tags` entirely with new tags
- On success: re-fetch posts, clear selection, clear tag input

**Edge cases:**
- Empty tag input → do nothing, no error
- Whitespace-only tags filtered out

---

## Batch B — BlogPost UX

### B1. Reading Progress Bar

**Where:** Fixed at very top of page, above Nav, z-index above everything.

**Spec:**
- Height: 3px
- Color: `bg-gray-900`
- Width: `${progress}%` where `progress = scrollY / (documentHeight - viewportHeight) * 100`
- Rendered in `BlogPost.jsx` only (not on other pages)
- Implemented as a `useReadingProgress` hook returning `progress` (0–100)

**Edge cases:**
- Short articles where page doesn't scroll → bar stays at 0, hidden or invisible (opacity-0)
- Progress clamped to 0–100

### B2. Table of Contents (TOC)

**Heading parsing:**
- Extract `## ` and `### ` headings from raw markdown via regex: `/^#{2,3}\s+(.+)$/gm`
- Slugify: lowercase, remove non-alphanumeric except spaces and Chinese chars, replace spaces with `-`
- Skip if fewer than 2 headings found

**Anchor injection in `MarkdownContent`:**
- Add custom `h2` and `h3` components to `ReactMarkdown` that render with `id={slugify(children)}`
- For HTML content branch: pre-process string to add `id` to `<h2>` and `<h3>` tags before `DOMPurify.sanitize`

**TOC Component (`TableOfContents.jsx`):**
- Props: `headings: [{level, text, id}]`, `activeId: string`
- Renders a list of anchor links (`<a href="#id">`)
- `###` headings indented with `pl-3`
- Active heading highlighted with `text-gray-900 font-medium` (others `text-gray-400`)

**Mobile (< lg):**
- `<details>` element above the article content with summary "目錄"
- No scroll spy on mobile (performance)

**Desktop (≥ lg):**
- `BlogPost` layout changes from `max-w-3xl mx-auto` to CSS Grid:
  ```
  max-w-5xl mx-auto
    grid grid-cols-[1fr_220px] gap-12
      [article content]   [sticky TOC aside at top-24]
  ```
- `IntersectionObserver` watches all `h2[id]` and `h3[id]` elements
- Updates `activeId` when heading enters viewport (threshold: top 20% of screen)

**New file:** `src/components/TableOfContents.jsx`
**Modified:** `src/components/MarkdownContent.jsx`, `src/pages/BlogPost.jsx`

### B3. Related Articles

**Where:** Below the share buttons at the bottom of BlogPost, above Footer.

**Data fetching:**
- After post loads, query: `supabase.from('posts').select('id, title, slug, tags, excerpt').eq('published', true).neq('slug', currentSlug)`
- Client-side filter: posts that share ≥1 tag with current post
- Sort by number of shared tags (desc), take top 3
- If no shared-tag posts found: skip rendering (no fallback to "all recent posts")

**UI:**
- Section heading: `相關文章`
- 3 cards in a row (responsive: 1 col mobile, 3 col desktop)
- Each card: title, tags, truncated excerpt (60 chars)
- Link to `/blog/<slug>`

**New file:** `src/components/RelatedPosts.jsx`

---

## Batch C — RSS Feed

**Endpoint:** `/rss.xml`

**Implementation:** Cloudflare Pages Function at `functions/rss.xml.js`

**Data:** Query Supabase REST API directly (no SDK, use `fetch` with API key header) for published posts ordered by `published_at DESC`.

**Fields used:** `title`, `slug`, `excerpt`, `published_at`

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Jimmy Hong | QA Blog</title>
    <link>https://jimmy-hong-portfolio.pages.dev</link>
    <description>關於 QA 流程、測試策略、自動化的技術文章。</description>
    <language>zh-TW</language>
    <item>
      <title>...</title>
      <link>https://jimmy-hong-portfolio.pages.dev/blog/<slug></link>
      <description>...</description>
      <pubDate>...</pubDate>
      <guid>https://jimmy-hong-portfolio.pages.dev/blog/<slug></guid>
    </item>
    ...
  </channel>
</rss>
```

**Secrets:** Supabase URL and anon key hardcoded in function (same values already in `upload-articles.mjs`). No sensitive data exposed.

**CORS:** Not needed — RSS readers fetch server-side.

---

## Implementation Order

1. **Batch A** — Admin changes, all in `AdminPosts.jsx`. Self-contained, no new components.
2. **Batch B1 + B2** — Reading progress bar first (simple hook), then TOC (requires layout change).
3. **Batch B3** — Related articles (depends on post being loaded, appended at bottom).
4. **Batch C** — RSS feed (independent, new file only).

---

## Out of Scope

- Algolia/full-text search (already exists client-side in Blog.jsx)
- Comment system
- Analytics per-post (separate concern)
- Dark mode
