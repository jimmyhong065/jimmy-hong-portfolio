# Infinite Read Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobile-only endless reading — scrolling past the end of an article silently appends the next most-related article below it, with URL updating as the user reads.

**Architecture:** A new `useInfiniteRead` hook manages state (seenSlugs, fetchNext). BlogPost.jsx adds IntersectionObservers: one on sentinel divs (one per article) to trigger fetching, one on `[data-slug]` article elements to update URL and activeSlug. Appended articles render inline below the main article, hidden on desktop.

**Tech Stack:** React 18, Vitest + @testing-library/react, Supabase JS client, IntersectionObserver (browser API), `window.history.replaceState`

---

## Files

| File | Action |
|---|---|
| `src/hooks/useInfiniteRead.js` | Create — fetch + deduplicate logic |
| `src/hooks/__tests__/useInfiniteRead.test.js` | Create — unit tests with Supabase mock |
| `src/pages/BlogPost.jsx` | Modify — state, observers, render |

---

## Task 1: `useInfiniteRead` hook

**Files:**
- Create: `src/hooks/useInfiniteRead.js`
- Create: `src/hooks/__tests__/useInfiniteRead.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useInfiniteRead.test.js`:

```js
import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useInfiniteRead } from '../useInfiniteRead'

// Mutable store controlled per-test
const db = { posts: [] }

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: db.posts }),
      }),
    }),
  },
}))

describe('useInfiniteRead', () => {
  beforeEach(() => { db.posts = [] })

  it('returns null immediately when initialTags is empty', async () => {
    const { result } = renderHook(() => useInfiniteRead([], 'current-slug'))
    const next = await result.current.fetchNext()
    expect(next).toBeNull()
  })

  it('returns highest-scoring related post', async () => {
    db.posts = [
      { slug: 'post-a', tags: ['QA'], published: true },
      { slug: 'post-b', tags: ['QA', '自動化'], published: true },
    ]
    const { result } = renderHook(() => useInfiniteRead(['QA', '自動化'], 'current-slug'))
    const next = await result.current.fetchNext()
    expect(next?.slug).toBe('post-b')
  })

  it('excludes initialSlug from results', async () => {
    db.posts = [
      { slug: 'current-slug', tags: ['QA'], published: true },
      { slug: 'other', tags: ['QA'], published: true },
    ]
    const { result } = renderHook(() => useInfiniteRead(['QA'], 'current-slug'))
    const next = await result.current.fetchNext()
    expect(next?.slug).toBe('other')
  })

  it('excludes previously fetched slugs on subsequent calls', async () => {
    db.posts = [
      { slug: 'post-a', tags: ['QA', '自動化'], published: true },
      { slug: 'post-b', tags: ['QA'], published: true },
    ]
    const { result } = renderHook(() => useInfiniteRead(['QA', '自動化'], 'current'))
    const first = await result.current.fetchNext()
    expect(first?.slug).toBe('post-a')
    const second = await result.current.fetchNext()
    expect(second?.slug).toBe('post-b')
  })

  it('returns null when no more unseen related posts', async () => {
    db.posts = [{ slug: 'post-a', tags: ['QA'], published: true }]
    const { result } = renderHook(() => useInfiniteRead(['QA'], 'current'))
    await result.current.fetchNext()         // consumes post-a
    const next = await result.current.fetchNext()
    expect(next).toBeNull()
  })

  it('returns null when no post has tag overlap', async () => {
    db.posts = [{ slug: 'post-a', tags: ['無關'], published: true }]
    const { result } = renderHook(() => useInfiniteRead(['QA'], 'current'))
    const next = await result.current.fetchNext()
    expect(next).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /Users/jimmyhong/Desktop/qa_self_blog && npm test src/hooks/__tests__/useInfiniteRead.test.js 2>&1 | tail -15
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement hook**

Create `src/hooks/useInfiniteRead.js`:

```js
import { useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useInfiniteRead(initialTags, initialSlug) {
  const seenSlugs = useRef(new Set([initialSlug]))
  const loadingRef = useRef(false)

  async function fetchNext() {
    if (loadingRef.current || !initialTags?.length) return null
    loadingRef.current = true
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
      if (!data) return null
      const next = data
        .filter(p => !seenSlugs.current.has(p.slug))
        .map(p => ({
          ...p,
          _score: (p.tags ?? []).filter(t => initialTags.includes(t)).length,
        }))
        .filter(p => p._score > 0)
        .sort((a, b) => b._score - a._score)[0] ?? null
      if (next) seenSlugs.current.add(next.slug)
      return next
    } finally {
      loadingRef.current = false
    }
  }

  return { fetchNext }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd /Users/jimmyhong/Desktop/qa_self_blog && npm test src/hooks/__tests__/useInfiniteRead.test.js 2>&1 | tail -10
```

Expected: 6 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
cd /Users/jimmyhong/Desktop/qa_self_blog && git add src/hooks/useInfiniteRead.js src/hooks/__tests__/useInfiniteRead.test.js && git commit -m "feat: add useInfiniteRead hook for tag-based article sequencing"
```

---

## Task 2: BlogPost.jsx integration

**Files:**
- Modify: `src/pages/BlogPost.jsx`

This task modifies BlogPost.jsx in three parts:
1. Add imports + state
2. Add IntersectionObservers (effects)
3. Update JSX (main article sentinel + data-slug, extra articles render)

- [ ] **Step 1: Add import for useInfiniteRead**

After the line `import { useReadHistory } from '../hooks/useReadHistory'`, add:

```js
import { useInfiniteRead } from '../hooks/useInfiniteRead'
```

- [ ] **Step 2: Add state inside component**

After `const markedRef = useRef(false)`, add:

```js
  const [extraArticles, setExtraArticles] = useState([])
  const [loadingNext, setLoadingNext] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const [activeSlug, setActiveSlug] = useState(slug)
  const sentinelRefs = useRef([])
  const loadingRef = useRef(false)
  const { fetchNext } = useInfiniteRead(post?.tags ?? [], slug)
```

- [ ] **Step 3: Add IntersectionObserver — sentinel (load next article)**

After the existing series `useEffect` block (around line 89), add:

```js
  // Infinite read — sentinel observer
  useEffect(() => {
    if (!post || exhausted) return
    const sentinels = sentinelRefs.current.filter(Boolean)
    if (!sentinels.length) return
    const observer = new IntersectionObserver(
      async (entries) => {
        const triggered = entries.find(
          e => e.isIntersecting && e.target === sentinels[sentinels.length - 1]
        )
        if (!triggered || loadingRef.current) return
        loadingRef.current = true
        setLoadingNext(true)
        const next = await fetchNext()
        if (next) setExtraArticles(prev => [...prev, next])
        else setExhausted(true)
        setLoadingNext(false)
        loadingRef.current = false
      },
      { threshold: 0.1 }
    )
    sentinels.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [post, extraArticles.length, exhausted])
```

- [ ] **Step 4: Add IntersectionObserver — URL + activeSlug tracking**

Immediately after the sentinel observer effect, add:

```js
  // Infinite read — URL + activeSlug tracking
  useEffect(() => {
    const articles = document.querySelectorAll('[data-slug]')
    if (!articles.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            const s = e.target.dataset.slug
            setActiveSlug(s)
            window.history.replaceState(null, '', `/blog/${s}`)
          }
        })
      },
      { threshold: 0.5 }
    )
    articles.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [extraArticles.length])
```

- [ ] **Step 5: Wire ArticleToolbar to activeSlug**

Find the `<ArticleToolbar` block near the bottom of the return (around line 312) and update the two bookmark props:

```jsx
      <ArticleToolbar
        fontSize={fontSize}
        dark={dark}
        onInc={incFontSize}
        onDec={decFontSize}
        onToggleDark={toggleDark}
        bookmarked={isBookmarked(activeSlug)}
        onToggleBookmark={() => toggle(activeSlug)}
      />
```

- [ ] **Step 6: Add data-slug to main article element + sentinel**

Find the `<article` opening tag (around line 163):
```jsx
          <article
            ref={swipeRef}
            className={`transition-colors article-font-${fontSize}${dark ? ' article-dark' : ''}`}
          >
```

Add `data-slug={slug}`:
```jsx
          <article
            ref={swipeRef}
            data-slug={slug}
            className={`transition-colors article-font-${fontSize}${dark ? ' article-dark' : ''}`}
          >
```

Then find the closing block inside `</article>` (the `<div className="mt-8">← 回文章列表</div>`):
```jsx
            <div className="mt-8">
              <Link to="/blog" className="text-xs text-gray-400 hover:text-gray-700">← 回文章列表</Link>
            </div>
          </article>
```

Replace with (adds sentinel after the link):
```jsx
            <div className="mt-8">
              <Link to="/blog" className="text-xs text-gray-400 hover:text-gray-700">← 回文章列表</Link>
            </div>
            {/* Infinite read sentinel — mobile only */}
            <div
              ref={el => { sentinelRefs.current[0] = el }}
              className="md:hidden h-1"
              aria-hidden="true"
            />
          </article>
```

- [ ] **Step 7: Render appended articles, loading spinner, and end marker**

After the closing `</div>` that wraps `<article>` and the desktop `<aside>` (around line 308, just before `</main>`):

```jsx
        </div>

        {/* Infinite read — appended articles (mobile only) */}
        {extraArticles.map((p, i) => {
          const pMin = p.content
            ? Math.max(1, Math.ceil(p.content.replace(/\s/g, '').length / 400))
            : null
          return (
            <div key={p.slug} className="md:hidden">
              {/* Separator */}
              <div className="my-10 flex items-center gap-3 text-xs text-gray-400">
                <div className="flex-1 border-t border-gray-200" />
                <span>下一篇</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <p className="text-sm font-semibold text-center text-gray-600 mb-8 line-clamp-2">
                {p.title}
              </p>
              <article
                data-slug={p.slug}
                className={`article-font-${fontSize}${dark ? ' article-dark' : ''}`}
              >
                {/* Tags */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {(p.tags ?? []).map(t => (
                    <Link
                      key={t}
                      to={`/blog?tag=${encodeURIComponent(t)}`}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
                {/* Title + meta */}
                <h2 className="text-2xl font-bold mb-2">{p.title}</h2>
                <p className="text-xs text-gray-400 mb-10 flex items-center gap-3">
                  {p.published_at ? p.published_at.slice(0, 10) : ''}
                  {pMin && <span className="text-gray-300">·</span>}
                  {pMin && <span>{pMin} 分鐘閱讀</span>}
                </p>
                {/* Content */}
                <MarkdownContent content={p.content?.replace(/^\s*#[^\n]*\n?/, '')} />
                {/* Sentinel */}
                <div
                  ref={el => { sentinelRefs.current[i + 1] = el }}
                  className="h-1"
                  aria-hidden="true"
                />
              </article>
            </div>
          )
        })}

        {/* Loading spinner */}
        {loadingNext && (
          <div className="md:hidden flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}

        {/* End marker */}
        {exhausted && (
          <p className="md:hidden text-center text-xs text-gray-400 py-12">
            — 已讀完所有相關文章 —
          </p>
        )}
      </main>
```

Note: remove the existing `</main>` line that was there before — the one above replaces it.

- [ ] **Step 8: Run full test suite to confirm no regressions**

```bash
cd /Users/jimmyhong/Desktop/qa_self_blog && npm test 2>&1 | grep -E "Test Files|Tests " | tail -3
```

Expected: same pre-existing 11 failures, count of passing tests increased by at least 6 (new useInfiniteRead tests).

- [ ] **Step 9: Commit**

```bash
cd /Users/jimmyhong/Desktop/qa_self_blog && git add src/pages/BlogPost.jsx && git commit -m "feat: infinite read — append related articles on mobile scroll"
```
