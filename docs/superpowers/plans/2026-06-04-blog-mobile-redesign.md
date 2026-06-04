# Blog Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改版 `/blog` 頁面手機體驗：tag filter 改橫向捲動、文章改卡片佈局、分頁改「載入更多」。

**Architecture:** 新增 `BlogCard` 元件（手機用卡片）；修改 `TagFilter`（橫向捲動 pill bar）；修改 `Blog.jsx`（手機用 BlogCard + Load More，桌機保留 BlogRow + 數字分頁）。桌機版完全不動。

**Tech Stack:** React 18, Tailwind CSS v3, Vitest + @testing-library/react

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/components/BlogCard.jsx` | 手機卡片：title + excerpt + top-3 tags + date |
| Create | `src/components/__tests__/BlogCard.test.jsx` | BlogCard 單元測試 |
| Modify | `src/components/TagFilter.jsx` | 橫向捲動 pill bar + 邊緣漸層 |
| Modify | `src/pages/Blog.jsx` | 手機/桌機分流渲染 + Load More state |

---

## Task 1: BlogCard component

**Files:**
- Create: `src/components/BlogCard.jsx`
- Create: `src/components/__tests__/BlogCard.test.jsx`

- [ ] **Step 1: 建立測試檔**

```jsx
// src/components/__tests__/BlogCard.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import BlogCard from '../BlogCard'

const post = {
  id: '1',
  title: 'Test Post Title',
  slug: 'test-post',
  excerpt: 'This is the excerpt text for testing.',
  tags: ['QA', 'Testing', 'CI/CD', 'ExtraTag'],
  published_at: '2026-06-04T00:00:00Z',
}

function renderCard(p = post) {
  return render(<MemoryRouter><BlogCard post={p} /></MemoryRouter>)
}

describe('BlogCard', () => {
  it('renders title', () => {
    renderCard()
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
  })

  it('renders excerpt', () => {
    renderCard()
    expect(screen.getByText('This is the excerpt text for testing.')).toBeInTheDocument()
  })

  it('renders formatted date', () => {
    renderCard()
    expect(screen.getByText('2026-06-04')).toBeInTheDocument()
  })

  it('shows at most 3 tags', () => {
    renderCard()
    expect(screen.getByText('QA')).toBeInTheDocument()
    expect(screen.getByText('Testing')).toBeInTheDocument()
    expect(screen.getByText('CI/CD')).toBeInTheDocument()
    expect(screen.queryByText('ExtraTag')).not.toBeInTheDocument()
  })

  it('links to correct post URL', () => {
    renderCard()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/test-post')
  })

  it('renders without excerpt (null) gracefully', () => {
    renderCard({ ...post, excerpt: null })
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
  })

  it('renders without tags (null) gracefully', () => {
    renderCard({ ...post, tags: null })
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
  })

  it('renders without published_at gracefully', () => {
    renderCard({ ...post, published_at: null })
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run src/components/__tests__/BlogCard.test.jsx
```

Expected: FAIL — "Cannot find module '../BlogCard'"

- [ ] **Step 3: 實作元件**

```jsx
// src/components/BlogCard.jsx
import { Link } from 'react-router-dom'

export default function BlogCard({ post }) {
  const date = post.published_at
    ? new Date(post.published_at).toISOString().slice(0, 10)
    : ''
  const tags = (post.tags ?? []).slice(0, 3)

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="block rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 hover:shadow-md transition-shadow"
    >
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

- [ ] **Step 4: 執行測試，確認通過**

```bash
npx vitest run src/components/__tests__/BlogCard.test.jsx
```

Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/BlogCard.jsx src/components/__tests__/BlogCard.test.jsx
git commit -m "feat: add BlogCard component for mobile blog listing"
```

---

## Task 2: TagFilter — 橫向捲動

**Files:**
- Modify: `src/components/TagFilter.jsx`

- [ ] **Step 1: 確認現有測試仍通過（baseline）**

```bash
npx vitest run src/components/__tests__/TagFilter.test.jsx
```

Expected: 3 tests PASS（這是現有測試，必須繼續通過）

- [ ] **Step 2: 修改 TagFilter.jsx**

將 `src/components/TagFilter.jsx` 的內容完整替換為：

```jsx
// src/components/TagFilter.jsx
export default function TagFilter({ tags, selected, onSelect }) {
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
        <button onClick={() => onSelect(null)} className={btnClass(selected === null)}>
          全部
        </button>
        {tags.map(tag => (
          <button key={tag} onClick={() => onSelect(tag)} className={btnClass(selected === tag)}>
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 執行既有測試，確認全部通過**

```bash
npx vitest run src/components/__tests__/TagFilter.test.jsx
```

Expected: 3 tests PASS（行為不變，只改 CSS）

- [ ] **Step 4: Commit**

```bash
git add src/components/TagFilter.jsx
git commit -m "feat: redesign TagFilter as horizontal scrollable pill bar"
```

---

## Task 3: Blog.jsx — 手機 BlogCard + Load More

**Files:**
- Modify: `src/pages/Blog.jsx`

- [ ] **Step 1: 讀取 Blog.jsx 確認目前結構**

讀取 `src/pages/Blog.jsx`。注意目前結構：
- `PAGE_SIZE = 12`
- `page` state 控制數字分頁
- `paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)` 供桌機用

- [ ] **Step 2: 修改 Blog.jsx**

完整取代 `src/pages/Blog.jsx` 內容：

```jsx
// src/pages/Blog.jsx
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import BlogRow from '../components/BlogRow'
import BlogCard from '../components/BlogCard'
import TagFilter from '../components/TagFilter'
import { usePosts } from '../hooks/usePosts'

const PAGE_SIZE = 12

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const { posts, loading } = usePosts()

  const selectedTag = searchParams.get('tag') || null

  function setSelectedTag(tag) {
    if (tag) setSearchParams({ tag })
    else setSearchParams({})
  }

  const allTags = useMemo(() => {
    const set = new Set(posts.flatMap(p => p.tags ?? []))
    return [...set]
  }, [posts])

  const filtered = useMemo(() => {
    let result = selectedTag ? posts.filter(p => p.tags?.includes(selectedTag)) : posts
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q)
      )
    }
    return result
  }, [posts, selectedTag, query])

  useEffect(() => {
    setPage(1)
    setVisibleCount(PAGE_SIZE)
  }, [selectedTag, query])

  // 桌機分頁
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 手機 load more
  const pagedMobile = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <>
      <SEOHead title="部落格" description="Jimmy Hong 關於 QA 流程、測試策略、自動化的技術文章。" canonical="/blog" />
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Blog</p>
        <h1 className="text-xl font-bold mb-8">文章</h1>
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋文章標題或摘要..."
            className="w-full text-sm border border-gray-200 rounded-full pl-10 pr-5 py-3 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
          />
        </div>
        <TagFilter tags={allTags} selected={selectedTag} onSelect={setSelectedTag} />
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-8">沒有符合的文章。</p>
        ) : (
          <>
            {/* 手機：卡片 + Load More */}
            <div className="md:hidden">
              {pagedMobile.map(p => <BlogCard key={p.id} post={p} />)}
              {hasMore ? (
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="w-full mt-4 py-3 text-sm text-gray-500 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors"
                >
                  載入更多
                </button>
              ) : (
                <p className="text-center text-xs text-gray-400 mt-6">
                  已顯示全部 {filtered.length} 篇
                </p>
              )}
            </div>

            {/* 桌機：row + 數字分頁（不動） */}
            <div className="hidden md:block">
              <div>{paged.map(p => <BlogRow key={p.id} post={p} />)}</div>
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} 篇，共 {filtered.length} 篇
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-30 hover:border-gray-400">←</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .reduce((acc, n, i, arr) => {
                        if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
                        acc.push(n)
                        return acc
                      }, [])
                      .map((n, i) => n === '…'
                        ? <span key={`e${i}`} className="text-xs px-2 py-1.5 text-gray-400">…</span>
                        : <button key={n} onClick={() => setPage(n)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${page === n ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}>
                            {n}
                          </button>
                      )}
                    <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-30 hover:border-gray-400">→</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: 執行全部測試，確認無 regression**

```bash
npx vitest run
```

Expected: 新增 8 個 BlogCard tests 通過，既有 TagFilter 3 tests 通過，pre-existing 11 failures 不變。

- [ ] **Step 4: Commit**

```bash
git add src/pages/Blog.jsx
git commit -m "feat: mobile blog listing with BlogCard and load-more pagination"
```

---

## Task 4: 手動驗收

- [ ] **Step 1: 啟動 dev server**

```bash
npm run dev
```

- [ ] **Step 2: 開啟 http://localhost:5179/blog，切換到 375px 手機尺寸**

- [ ] Tag bar 單行橫向捲動，不換行
- [ ] 左右邊緣有漸層 fade
- [ ] 點選 tag → 高亮（黑底白字），文章篩選正確
- [ ] 文章顯示為白底卡片（title + 摘要 + date）
- [ ] 最多顯示 3 個 tag per 卡片
- [ ] 超過 12 篇時顯示「載入更多」按鈕
- [ ] 點「載入更多」→ 顯示更多卡片
- [ ] 全部載入後顯示「已顯示全部 N 篇」
- [ ] 切換 tag 或搜尋後 reset 回 12 篇

- [ ] **Step 3: 切換到桌機尺寸（1024px+）**

- [ ] 卡片不顯示（md:hidden 生效）
- [ ] BlogRow 照舊顯示
- [ ] 數字分頁照舊
