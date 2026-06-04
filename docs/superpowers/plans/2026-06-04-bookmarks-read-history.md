# Bookmarks & Read History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add localStorage-based bookmarking and auto-read tracking to the blog, with a `/saved` page and mobile nav tab.

**Architecture:** Two focused hooks (`useBookmarks`, `useReadHistory`) store slug arrays in localStorage. `ArticleToolbar` gains a bookmark toggle. `BlogPost` auto-marks read at 80% scroll. `Blog` listing gains special filter pills. `/saved` page fetches bookmarked posts from Supabase.

**Tech Stack:** React hooks, localStorage, Supabase (read-only query in Saved page), Tailwind CSS, Vitest + @testing-library/react

---

## Files Created / Modified

| File | Action |
|------|--------|
| `src/hooks/useBookmarks.js` | Create |
| `src/hooks/__tests__/useBookmarks.test.js` | Create |
| `src/hooks/useReadHistory.js` | Create |
| `src/hooks/__tests__/useReadHistory.test.js` | Create |
| `src/components/ArticleToolbar.jsx` | Add `bookmarked`, `onToggleBookmark` props |
| `src/components/__tests__/ArticleToolbar.test.jsx` | Add bookmark tests |
| `src/pages/BlogPost.jsx` | Wire auto-read trigger + pass bookmark props to toolbar |
| `src/components/BlogCard.jsx` | Add `isRead` prop + ✓ badge |
| `src/components/__tests__/BlogCard.test.jsx` | Add isRead tests |
| `src/components/TagFilter.jsx` | Add `specialFilter`, `onSpecialFilter` props + divider |
| `src/components/__tests__/TagFilter.test.jsx` | Add special filter tests |
| `src/pages/Blog.jsx` | Wire `useBookmarks`, `useReadHistory`, `specialFilter` |
| `src/pages/Saved.jsx` | Create |
| `src/components/Nav.jsx` | Replace 合作方式 tab with 收藏 |
| `src/App.jsx` | Add `/saved` route |

---

## Task 1: useBookmarks hook

**Files:**
- Create: `src/hooks/useBookmarks.js`
- Create: `src/hooks/__tests__/useBookmarks.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/hooks/__tests__/useBookmarks.test.js
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useBookmarks } from '../useBookmarks'

describe('useBookmarks', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to empty bookmarks', () => {
    const { result } = renderHook(() => useBookmarks())
    expect(result.current.bookmarks).toEqual([])
  })

  it('toggle adds a slug', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => result.current.toggle('my-post'))
    expect(result.current.bookmarks).toContain('my-post')
  })

  it('toggle removes a slug that was already added', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => result.current.toggle('my-post'))
    act(() => result.current.toggle('my-post'))
    expect(result.current.bookmarks).not.toContain('my-post')
  })

  it('isBookmarked returns true after adding', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => result.current.toggle('my-post'))
    expect(result.current.isBookmarked('my-post')).toBe(true)
  })

  it('isBookmarked returns false for unknown slug', () => {
    const { result } = renderHook(() => useBookmarks())
    expect(result.current.isBookmarked('unknown')).toBe(false)
  })

  it('persists bookmarks to localStorage', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => result.current.toggle('my-post'))
    expect(JSON.parse(localStorage.getItem('blog-bookmarks'))).toContain('my-post')
  })

  it('reads persisted bookmarks on init', () => {
    localStorage.setItem('blog-bookmarks', JSON.stringify(['saved-post']))
    const { result } = renderHook(() => useBookmarks())
    expect(result.current.isBookmarked('saved-post')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test src/hooks/__tests__/useBookmarks.test.js
```

Expected: `Cannot find module '../useBookmarks'`

- [ ] **Step 3: Implement useBookmarks**

```js
// src/hooks/useBookmarks.js
import { useState } from 'react'

const KEY = 'blog-bookmarks'

function readStorage() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(readStorage)

  function toggle(slug) {
    const next = bookmarks.includes(slug)
      ? bookmarks.filter(s => s !== slug)
      : [...bookmarks, slug]
    setBookmarks(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  function isBookmarked(slug) { return bookmarks.includes(slug) }

  return { bookmarks, toggle, isBookmarked }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/hooks/__tests__/useBookmarks.test.js
```

Expected: 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBookmarks.js src/hooks/__tests__/useBookmarks.test.js
git commit -m "feat: add useBookmarks hook with localStorage persistence"
```

---

## Task 2: useReadHistory hook

**Files:**
- Create: `src/hooks/useReadHistory.js`
- Create: `src/hooks/__tests__/useReadHistory.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/hooks/__tests__/useReadHistory.test.js
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useReadHistory } from '../useReadHistory'

describe('useReadHistory', () => {
  beforeEach(() => localStorage.clear())

  it('isRead returns false for unknown slug', () => {
    const { result } = renderHook(() => useReadHistory())
    expect(result.current.isRead('unknown')).toBe(false)
  })

  it('markRead makes isRead return true', () => {
    const { result } = renderHook(() => useReadHistory())
    act(() => result.current.markRead('my-post'))
    expect(result.current.isRead('my-post')).toBe(true)
  })

  it('markRead is idempotent (no duplicates in storage)', () => {
    const { result } = renderHook(() => useReadHistory())
    act(() => result.current.markRead('my-post'))
    act(() => result.current.markRead('my-post'))
    const stored = JSON.parse(localStorage.getItem('blog-read-history'))
    expect(stored.filter(s => s === 'my-post')).toHaveLength(1)
  })

  it('persists read history to localStorage', () => {
    const { result } = renderHook(() => useReadHistory())
    act(() => result.current.markRead('my-post'))
    expect(JSON.parse(localStorage.getItem('blog-read-history'))).toContain('my-post')
  })

  it('reads persisted history on init', () => {
    localStorage.setItem('blog-read-history', JSON.stringify(['old-post']))
    const { result } = renderHook(() => useReadHistory())
    expect(result.current.isRead('old-post')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test src/hooks/__tests__/useReadHistory.test.js
```

Expected: `Cannot find module '../useReadHistory'`

- [ ] **Step 3: Implement useReadHistory**

```js
// src/hooks/useReadHistory.js
import { useState } from 'react'

const KEY = 'blog-read-history'

function readStorage() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function useReadHistory() {
  const [readSlugs, setReadSlugs] = useState(() => new Set(readStorage()))

  function markRead(slug) {
    if (readSlugs.has(slug)) return
    const next = new Set(readSlugs)
    next.add(slug)
    setReadSlugs(next)
    localStorage.setItem(KEY, JSON.stringify([...next]))
  }

  function isRead(slug) { return readSlugs.has(slug) }

  return { markRead, isRead }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/hooks/__tests__/useReadHistory.test.js
```

Expected: 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useReadHistory.js src/hooks/__tests__/useReadHistory.test.js
git commit -m "feat: add useReadHistory hook with 80%-read auto-mark support"
```

---

## Task 3: ArticleToolbar — bookmark button

**Files:**
- Modify: `src/components/ArticleToolbar.jsx`
- Modify: `src/components/__tests__/ArticleToolbar.test.jsx`

- [ ] **Step 1: Add failing tests for bookmark button**

Append to the existing `describe('ArticleToolbar', ...)` block in `src/components/__tests__/ArticleToolbar.test.jsx`:

```js
  it('shows ☆ when not bookmarked', () => {
    render(<ArticleToolbar {...defaults} bookmarked={false} onToggleBookmark={vi.fn()} />)
    expect(screen.getByLabelText('加入收藏')).toBeInTheDocument()
  })

  it('shows ★ when bookmarked', () => {
    render(<ArticleToolbar {...defaults} bookmarked={true} onToggleBookmark={vi.fn()} />)
    expect(screen.getByLabelText('取消收藏')).toBeInTheDocument()
  })

  it('calls onToggleBookmark when bookmark button clicked', () => {
    const onToggleBookmark = vi.fn()
    render(<ArticleToolbar {...defaults} bookmarked={false} onToggleBookmark={onToggleBookmark} />)
    fireEvent.click(screen.getByLabelText('加入收藏'))
    expect(onToggleBookmark).toHaveBeenCalledTimes(1)
  })
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test src/components/__tests__/ArticleToolbar.test.jsx
```

Expected: 3 new tests fail with `Unable to find an accessible element`

- [ ] **Step 3: Update ArticleToolbar**

Replace the entire content of `src/components/ArticleToolbar.jsx`:

```jsx
const FONT_LABELS = { sm: '14px', md: '16px', lg: '18px' }

export default function ArticleToolbar({ fontSize, dark, onInc, onDec, onToggleDark, bookmarked = false, onToggleBookmark = () => {} }) {
  return (
    <div
      className="fixed left-0 right-0 lg:hidden z-40 border-t shadow-sm"
      style={{
        bottom: 'calc(3rem + env(safe-area-inset-bottom))',
        ...(dark
          ? { backgroundColor: '#1e1e1e', borderColor: '#333' }
          : { backgroundColor: '#ffffff', borderColor: '#f3f4f6' }),
      }}
    >
      <div className="flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-3">
          <button
            onClick={onDec}
            disabled={fontSize === 'sm'}
            className="text-sm disabled:opacity-30 px-1"
            style={{ color: dark ? '#9ca3af' : '#6b7280' }}
            aria-label="縮小字體"
          >
            A−
          </button>
          <span
            className="text-xs w-8 text-center"
            style={{ color: dark ? '#6b7280' : '#9ca3af' }}
          >
            {FONT_LABELS[fontSize]}
          </span>
          <button
            onClick={onInc}
            disabled={fontSize === 'lg'}
            className="text-sm disabled:opacity-30 px-1"
            style={{ color: dark ? '#9ca3af' : '#6b7280' }}
            aria-label="放大字體"
          >
            A+
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleBookmark}
            className="text-lg leading-none"
            style={{ color: bookmarked ? (dark ? '#e5e7eb' : '#111827') : (dark ? '#6b7280' : '#d1d5db') }}
            aria-label={bookmarked ? '取消收藏' : '加入收藏'}
          >
            {bookmarked ? '★' : '☆'}
          </button>
          <button
            onClick={onToggleDark}
            className="text-lg leading-none"
            aria-label={dark ? '切換亮色模式' : '切換暗色模式'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/components/__tests__/ArticleToolbar.test.jsx
```

Expected: all tests pass (including previous ones)

- [ ] **Step 5: Commit**

```bash
git add src/components/ArticleToolbar.jsx src/components/__tests__/ArticleToolbar.test.jsx
git commit -m "feat: add bookmark toggle button to ArticleToolbar"
```

---

## Task 4: BlogPost — wire auto-read + bookmark to toolbar

**Files:**
- Modify: `src/pages/BlogPost.jsx`

- [ ] **Step 1: Add imports at top of BlogPost.jsx**

Locate line 1 (`// src/pages/BlogPost.jsx`) and the existing imports. Add:

```js
// Add useRef to the existing React import:
import { useState, useEffect, useRef } from 'react'

// Add these two lines after the existing hook imports:
import { useBookmarks } from '../hooks/useBookmarks'
import { useReadHistory } from '../hooks/useReadHistory'
```

- [ ] **Step 2: Add hook calls in the component body**

After the line `const swipeRef = useSwipeNav(...)`, add:

```js
  const { isBookmarked, toggle } = useBookmarks()
  const { markRead } = useReadHistory()
  const markedRef = useRef(false)
```

- [ ] **Step 3: Add auto-read effects**

After the `markedRef` declaration, add two effects:

```js
  // Reset the "already marked" guard when navigating to a different article
  useEffect(() => {
    markedRef.current = false
  }, [slug])

  // Auto-mark read when user scrolls past 80%
  useEffect(() => {
    if (progress >= 80 && !markedRef.current && slug) {
      markRead(slug)
      markedRef.current = true
    }
  }, [progress, slug, markRead])
```

- [ ] **Step 4: Update ArticleToolbar JSX call**

Find the `<ArticleToolbar` block (near the bottom of the return statement) and add the two new props:

```jsx
      <ArticleToolbar
        fontSize={fontSize}
        dark={dark}
        onInc={incFontSize}
        onDec={decFontSize}
        onToggleDark={toggleDark}
        bookmarked={isBookmarked(slug)}
        onToggleBookmark={() => toggle(slug)}
      />
```

- [ ] **Step 5: Manual smoke test**

Start dev server (`npm run dev`), open an article, scroll past 80%, check `localStorage.getItem('blog-read-history')` in DevTools console — should contain the article slug. Tap ★/☆ button, check `localStorage.getItem('blog-bookmarks')`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/BlogPost.jsx
git commit -m "feat: wire auto-read at 80% and bookmark toggle in BlogPost"
```

---

## Task 5: BlogCard — isRead indicator

**Files:**
- Modify: `src/components/BlogCard.jsx`
- Modify: `src/components/__tests__/BlogCard.test.jsx`

- [ ] **Step 1: Add failing tests**

In `src/components/__tests__/BlogCard.test.jsx`:

First, replace the `renderCard` helper (before the `describe` block):

```js
function renderCard(p = post, isRead = false) {
  return render(<MemoryRouter><BlogCard post={p} isRead={isRead} /></MemoryRouter>)
}
```

Then append these two tests inside the existing `describe('BlogCard', ...)` block:

```js
  it('shows ✓ badge when isRead is true', () => {
    renderCard(post, true)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('does not show ✓ badge when isRead is false', () => {
    renderCard(post, false)
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test src/components/__tests__/BlogCard.test.jsx
```

Expected: 2 new tests fail

- [ ] **Step 3: Update BlogCard**

Replace the entire content of `src/components/BlogCard.jsx`:

```jsx
import { Link } from 'react-router-dom'

export default function BlogCard({ post, isRead = false }) {
  const date = post.published_at ? post.published_at.slice(0, 10) : ''
  const tags = (post.tags ?? []).slice(0, 3)

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`block rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 hover:shadow-md transition-shadow relative${isRead ? ' opacity-60' : ''}`}
    >
      {isRead && (
        <span className="absolute top-3 right-3 text-[10px] text-gray-400">✓</span>
      )}
      {tags.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{post.title}</p>
      {post.excerpt && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
      )}
      {date && <p className="text-xs text-gray-400">{date}</p>}
    </Link>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/components/__tests__/BlogCard.test.jsx
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/BlogCard.jsx src/components/__tests__/BlogCard.test.jsx
git commit -m "feat: add isRead indicator (✓ badge + opacity) to BlogCard"
```

---

## Task 6: TagFilter — special filter pills

**Files:**
- Modify: `src/components/TagFilter.jsx`
- Modify: `src/components/__tests__/TagFilter.test.jsx`

- [ ] **Step 1: Add failing tests**

Append to the existing `describe('TagFilter', ...)` block in `src/components/__tests__/TagFilter.test.jsx`:

```js
  it('renders 未讀 and 收藏 pills', () => {
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} specialFilter={null} onSpecialFilter={() => {}} />)
    expect(screen.getByText('未讀')).toBeInTheDocument()
    expect(screen.getByText('收藏')).toBeInTheDocument()
  })

  it('calls onSpecialFilter with "unread" when 未讀 clicked', () => {
    const onSpecialFilter = vi.fn()
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} specialFilter={null} onSpecialFilter={onSpecialFilter} />)
    fireEvent.click(screen.getByText('未讀'))
    expect(onSpecialFilter).toHaveBeenCalledWith('unread')
  })

  it('calls onSpecialFilter with "saved" when 收藏 clicked', () => {
    const onSpecialFilter = vi.fn()
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} specialFilter={null} onSpecialFilter={onSpecialFilter} />)
    fireEvent.click(screen.getByText('收藏'))
    expect(onSpecialFilter).toHaveBeenCalledWith('saved')
  })

  it('clears tag selection when special filter selected', () => {
    const onSelect = vi.fn()
    render(<TagFilter tags={tags} selected="CI/CD" onSelect={onSelect} specialFilter={null} onSpecialFilter={() => {}} />)
    fireEvent.click(screen.getByText('未讀'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('全部 button clears both tag and special filter', () => {
    const onSelect = vi.fn()
    const onSpecialFilter = vi.fn()
    render(<TagFilter tags={tags} selected="CI/CD" onSelect={onSelect} specialFilter="unread" onSpecialFilter={onSpecialFilter} />)
    fireEvent.click(screen.getByText('全部'))
    expect(onSelect).toHaveBeenCalledWith(null)
    expect(onSpecialFilter).toHaveBeenCalledWith(null)
  })

  it('全部 button is active only when both filters are null', () => {
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} specialFilter="unread" onSpecialFilter={() => {}} />)
    const allBtn = screen.getByText('全部')
    expect(allBtn.className).not.toMatch(/bg-gray-900/)
  })
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test src/components/__tests__/TagFilter.test.jsx
```

Expected: 6 new tests fail

- [ ] **Step 3: Update TagFilter**

Replace the entire content of `src/components/TagFilter.jsx`:

```jsx
export default function TagFilter({ tags, selected, onSelect, specialFilter = null, onSpecialFilter = () => {} }) {
  if (!tags || tags.length === 0) return null

  const btnClass = (active) =>
    `flex-shrink-0 text-xs px-4 py-1.5 rounded-full border transition-colors ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
    }`

  return (
    <div className="relative mb-8">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 px-1">
        <button
          onClick={() => { onSelect(null); onSpecialFilter(null) }}
          className={btnClass(selected === null && specialFilter === null)}
        >
          全部
        </button>
        <button
          onClick={() => { onSpecialFilter('unread'); onSelect(null) }}
          className={btnClass(specialFilter === 'unread')}
        >
          未讀
        </button>
        <button
          onClick={() => { onSpecialFilter('saved'); onSelect(null) }}
          className={btnClass(specialFilter === 'saved')}
        >
          收藏
        </button>
        <span className="flex-shrink-0 self-center text-gray-300 px-1 select-none">|</span>
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => { onSelect(tag); onSpecialFilter(null) }}
            className={btnClass(selected === tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test src/components/__tests__/TagFilter.test.jsx
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/TagFilter.jsx src/components/__tests__/TagFilter.test.jsx
git commit -m "feat: add 未讀/收藏 special filter pills to TagFilter"
```

---

## Task 7: Blog.jsx — wire hooks + special filter

**Files:**
- Modify: `src/pages/Blog.jsx`

- [ ] **Step 1: Add imports**

At the top of `src/pages/Blog.jsx`, add after the existing imports:

```js
import { useBookmarks } from '../hooks/useBookmarks'
import { useReadHistory } from '../hooks/useReadHistory'
```

- [ ] **Step 2: Add hook calls and specialFilter state**

After `const { posts, loading } = usePosts()`, add:

```js
  const { isBookmarked } = useBookmarks()
  const { isRead } = useReadHistory()
  const [specialFilter, setSpecialFilter] = useState(null)
```

- [ ] **Step 3: Update the filtered useMemo**

Replace the existing `filtered` useMemo:

```js
  const filtered = useMemo(() => {
    let result = selectedTag ? posts.filter(p => p.tags?.includes(selectedTag)) : posts
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q)
      )
    }
    if (specialFilter === 'unread') result = result.filter(p => !isRead(p.slug))
    if (specialFilter === 'saved') result = result.filter(p => isBookmarked(p.slug))
    return result
  }, [posts, selectedTag, query, specialFilter, isRead, isBookmarked])
```

- [ ] **Step 4: Add specialFilter reset on filter changes**

Update the existing `useEffect` that resets pagination:

```js
  useEffect(() => {
    setPage(1)
    setVisibleCount(PAGE_SIZE)
  }, [selectedTag, query, specialFilter])
```

- [ ] **Step 5: Update TagFilter call**

Replace the `<TagFilter .../>` line:

```jsx
        <TagFilter
          tags={allTags}
          selected={selectedTag}
          onSelect={setSelectedTag}
          specialFilter={specialFilter}
          onSpecialFilter={setSpecialFilter}
        />
```

- [ ] **Step 6: Pass isRead to BlogCard (mobile)**

In the mobile `pagedMobile.map`, update:

```jsx
              {pagedMobile.map(p => <BlogCard key={p.id} post={p} isRead={isRead(p.slug)} />)}
```

- [ ] **Step 7: Smoke test**

Open blog listing, click 未讀 — only unread articles show. Click 收藏 — only bookmarked articles show. Click 全部 — all articles show. Tag selection still works independently.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Blog.jsx
git commit -m "feat: wire useBookmarks + useReadHistory + specialFilter into Blog listing"
```

---

## Task 8: Saved page

**Files:**
- Create: `src/pages/Saved.jsx`

- [ ] **Step 1: Create Saved.jsx**

```jsx
// src/pages/Saved.jsx
import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import BlogCard from '../components/BlogCard'
import { useBookmarks } from '../hooks/useBookmarks'
import { useReadHistory } from '../hooks/useReadHistory'
import { supabase } from '../lib/supabase'

export default function Saved() {
  const { bookmarks } = useBookmarks()
  const { isRead } = useReadHistory()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookmarks.length === 0) {
      setPosts([])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('posts')
      .select('*')
      .in('slug', bookmarks)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? [])
        setLoading(false)
      })
  }, [bookmarks])

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-12 py-16 pb-28 lg:pb-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Saved</p>
        <h1 className="text-xl font-bold mb-8">我的收藏</h1>
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">★</p>
            <p className="text-sm text-gray-500">還沒有收藏的文章</p>
            <p className="text-xs text-gray-400 mt-1">在閱讀時點 ★ 加入收藏</p>
          </div>
        ) : (
          <div>
            {posts.map(p => (
              <BlogCard key={p.id} post={p} isRead={isRead(p.slug)} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Smoke test (requires App route — do this after Task 9)**

Skip for now; test after routing is wired.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Saved.jsx
git commit -m "feat: add Saved page at /saved with bookmarked article list"
```

---

## Task 9: Nav + App routing

**Files:**
- Modify: `src/components/Nav.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace 合作方式 tab in Nav.jsx**

In `src/components/Nav.jsx`, find the TABS entry with `to: '/services'` and replace it:

```js
  {
    to: '/saved',
    label: '收藏',
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
    ),
  },
```

- [ ] **Step 2: Add Saved import and route in App.jsx**

In `src/App.jsx`, add the import after the existing page imports:

```js
import Saved from './pages/Saved'
```

Add route inside `<Routes>` after the `/blog/:slug` route:

```jsx
          <Route path="/saved" element={<Saved />} />
```

- [ ] **Step 3: Smoke test full flow**

1. Open an article, scroll past 80% → check localStorage has the slug in `blog-read-history`
2. Tap ★ button → check localStorage has the slug in `blog-bookmarks`; button turns filled ★
3. Navigate to Blog listing → article shows ✓ badge + opacity on mobile
4. Tap 未讀 pill → bookmarked article is hidden (it's been read)
5. Tap 收藏 pill → bookmarked article appears
6. Tap 收藏 tab in bottom nav → /saved page shows the article
7. Tap ★ again on article → un-bookmarks; /saved page updates

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.jsx src/App.jsx
git commit -m "feat: add /saved route and replace 合作方式 nav tab with 收藏"
```
