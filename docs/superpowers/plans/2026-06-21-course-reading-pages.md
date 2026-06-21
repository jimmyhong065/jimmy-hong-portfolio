# Course Reading Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public-shaped course reading experience — a course landing page (`/course/:slug`) listing chapters and a chapter reading page (`/course/:slug/:chapterSlug`) — usable now as an admin preview (`?preview=1`) of unpublished courses and ready to go live when published.

**Architecture:** Chapters already live in `posts` (linked by `course_id`, ordered by `course_order`). A new `useCourse` hook fetches a course + its chapters by slug with preview-aware filtering. Two new lazy-loaded pages render the landing and chapter views, reusing the existing `MarkdownContent`, `TableOfContents`, `useReadingProgress`, and `useReadHistory`. Course chapters stay course-exclusive by excluding `course_id` rows from `/blog` listings and blog post navigation.

**Tech Stack:** React + React Router (lazy routes), Supabase JS client, Vitest + @testing-library/react (jsdom), react-helmet-async.

---

## File Structure

New:
- `src/hooks/useCourse.js` — fetch course + chapters by slug (preview-aware); exports pure `adjacentChapters(chapters, slug)` helper.
- `src/pages/CourseLanding.jsx` — course landing (cover, meta, chapter list, read markers, progress).
- `src/pages/CourseChapter.jsx` — chapter reading page (content, progress bar, prev/next, back to course).

Modified:
- `src/hooks/usePosts.js` — exclude `course_id` rows.
- `src/pages/BlogPost.jsx` — prev/next + series queries exclude `course_id`.
- `src/App.jsx` — add two lazy routes.
- `src/pages/admin/AdminCourses.jsx` — preview button per course.
- `src/pages/admin/AdminCourseEdit.jsx` — preview button.

Test files:
- `src/hooks/__tests__/useCourse.test.js`
- `src/hooks/__tests__/usePosts.test.js` (extend existing)

---

## Task 1: Exclude course chapters from `/blog` listing

**Files:**
- Modify: `src/hooks/usePosts.js`
- Test: `src/hooks/__tests__/usePosts.test.js`

- [ ] **Step 1: Add a failing test asserting `course_id` is excluded**

Append inside the existing `describe('usePosts', ...)` block in `src/hooks/__tests__/usePosts.test.js`:

```js
  it('excludes course chapters via .is(course_id, null)', async () => {
    const isSpy = vi.fn().mockReturnThis()
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: isSpy,
      order: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
    })
    const { result } = renderHook(() => usePosts())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(isSpy).toHaveBeenCalledWith('course_id', null)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/usePosts.test.js`
Expected: FAIL — the new test errors because the mocked builder has no `.is` chained in `usePosts` (or `isSpy` not called).

- [ ] **Step 3: Add the `.is('course_id', null)` filter**

In `src/hooks/usePosts.js`, change the query builder:

```js
    let query = supabase
      .from('posts')
      .select('id, title, slug, excerpt, tags, published_at')
      .eq('published', true)
      .is('course_id', null)
```

- [ ] **Step 4: Update the first two tests' mocks to include `.is`**

The two existing tests mock a builder without `.is`. Add `is: vi.fn().mockReturnThis(),` to both mock objects (the `beforeEach` mock and the in-test mock in "filters posts by tag") so the chain does not throw:

```js
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
    })
```

And the tag-filter test's mock gains `is: vi.fn().mockReturnThis(),` as well.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/hooks/__tests__/usePosts.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePosts.js src/hooks/__tests__/usePosts.test.js
git commit -m "feat(blog): exclude course chapters from /blog listing"
```

---

## Task 2: `adjacentChapters` pure helper

**Files:**
- Create: `src/hooks/useCourse.js`
- Test: `src/hooks/__tests__/useCourse.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useCourse.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { adjacentChapters } from '../useCourse'

const chapters = [
  { slug: 'c1', course_order: 1 },
  { slug: 'c2', course_order: 2 },
  { slug: 'c3', course_order: 3 },
]

describe('adjacentChapters', () => {
  it('returns prev and next for a middle chapter', () => {
    expect(adjacentChapters(chapters, 'c2')).toEqual({
      prev: chapters[0],
      next: chapters[2],
    })
  })

  it('first chapter has no prev', () => {
    expect(adjacentChapters(chapters, 'c1')).toEqual({ prev: null, next: chapters[1] })
  })

  it('last chapter has no next', () => {
    expect(adjacentChapters(chapters, 'c3')).toEqual({ prev: chapters[1], next: null })
  })

  it('unknown slug returns nulls', () => {
    expect(adjacentChapters(chapters, 'x')).toEqual({ prev: null, next: null })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useCourse.test.js`
Expected: FAIL — `adjacentChapters` is not exported / module missing.

- [ ] **Step 3: Create the helper (minimal module)**

Create `src/hooks/useCourse.js`:

```js
export function adjacentChapters(chapters, slug) {
  const i = chapters.findIndex(c => c.slug === slug)
  if (i === -1) return { prev: null, next: null }
  return {
    prev: i > 0 ? chapters[i - 1] : null,
    next: i < chapters.length - 1 ? chapters[i + 1] : null,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useCourse.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCourse.js src/hooks/__tests__/useCourse.test.js
git commit -m "feat(course): adjacentChapters helper"
```

---

## Task 3: `useCourse` hook

**Files:**
- Modify: `src/hooks/useCourse.js`
- Test: `src/hooks/__tests__/useCourse.test.js`

The hook fetches the course by slug and its chapters (light fields, no content), ordered by `course_order`. When not in preview, an unpublished course is treated as not found, and only published chapters are returned.

- [ ] **Step 1: Write the failing test**

Add to the top of `src/hooks/__tests__/useCourse.test.js` (above the existing `describe`):

```js
import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({ supabase: { from: vi.fn() } }))
import { supabase } from '../../lib/supabase'
import { useCourse } from '../useCourse'

function mockCourseQueries({ course, chapters }) {
  // courses query: from('courses').select().eq('slug', slug).single()
  const coursesBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: course, error: null }),
  }
  // posts query: from('posts').select().eq('course_id', id)[.eq('published',true)].order()
  const postsBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: chapters, error: null }),
  }
  supabase.from.mockImplementation(table =>
    table === 'courses' ? coursesBuilder : postsBuilder
  )
  return { coursesBuilder, postsBuilder }
}

describe('useCourse', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns course and chapters sorted by course_order', async () => {
    mockCourseQueries({
      course: { id: 'k1', slug: 'qa-comm', title: 'QA 溝通課', published: true },
      chapters: [
        { slug: 'c1', title: 'A', course_order: 1, published: true },
        { slug: 'c2', title: 'B', course_order: 2, published: true },
      ],
    })
    const { result } = renderHook(() => useCourse('qa-comm', { preview: false }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.course.title).toBe('QA 溝通課')
    expect(result.current.chapters).toHaveLength(2)
    expect(result.current.notFound).toBe(false)
  })

  it('unpublished course is notFound when not preview', async () => {
    mockCourseQueries({
      course: { id: 'k1', slug: 'qa-comm', title: 'x', published: false },
      chapters: [],
    })
    const { result } = renderHook(() => useCourse('qa-comm', { preview: false }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notFound).toBe(true)
  })

  it('unpublished course is visible in preview', async () => {
    mockCourseQueries({
      course: { id: 'k1', slug: 'qa-comm', title: 'x', published: false },
      chapters: [{ slug: 'c1', title: 'A', course_order: 1, published: false }],
    })
    const { result } = renderHook(() => useCourse('qa-comm', { preview: true }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notFound).toBe(false)
    expect(result.current.chapters).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useCourse.test.js`
Expected: FAIL — `useCourse` is not exported.

- [ ] **Step 3: Implement the hook**

Add to `src/hooks/useCourse.js` (keep the existing `adjacentChapters` export):

```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCourse(slug, { preview = false } = {}) {
  const [course, setCourse] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    async function load() {
      const { data: courseRow } = await supabase
        .from('courses').select('*').eq('slug', slug).single()
      if (cancelled) return

      if (!courseRow || (!preview && !courseRow.published)) {
        setCourse(null)
        setChapters([])
        setNotFound(true)
        setLoading(false)
        return
      }

      let q = supabase
        .from('posts')
        .select('id, title, slug, course_order, cover_url, published')
        .eq('course_id', courseRow.id)
      if (!preview) q = q.eq('published', true)
      const { data: chapterRows } = await q.order('course_order')
      if (cancelled) return

      setCourse(courseRow)
      setChapters(chapterRows ?? [])
      setNotFound(false)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [slug, preview])

  return { course, chapters, loading, notFound }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/__tests__/useCourse.test.js`
Expected: PASS (3 `useCourse` tests + 4 `adjacentChapters` tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCourse.js src/hooks/__tests__/useCourse.test.js
git commit -m "feat(course): useCourse hook with preview-aware filtering"
```

---

## Task 4: CourseLanding page

**Files:**
- Create: `src/pages/CourseLanding.jsx`
- Test: `src/pages/__tests__/CourseLanding.test.jsx`

Renders cover/title/subtitle/description, a numbered chapter list linking to `/course/:slug/:chapterSlug` (preserving `?preview=1`), per-chapter read markers via `useReadHistory`, and an "X / N 章" read-progress line.

- [ ] **Step 1: Write the failing render test**

Create `src/pages/__tests__/CourseLanding.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../hooks/useCourse', () => ({
  useCourse: vi.fn(),
  adjacentChapters: vi.fn(),
}))
vi.mock('../../hooks/useReadHistory', () => ({
  useReadHistory: () => ({ isRead: s => s === 'c1', markRead: vi.fn() }),
}))
vi.mock('../../components/Nav', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))

import { useCourse } from '../../hooks/useCourse'
import CourseLanding from '../CourseLanding'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/course/:slug" element={<CourseLanding />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CourseLanding', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders chapter list and read progress', () => {
    useCourse.mockReturnValue({
      course: { title: 'QA 溝通課', subtitle: '問對問題', description: '簡介', cover_url: null },
      chapters: [
        { slug: 'c1', title: '第一章', course_order: 1 },
        { slug: 'c2', title: '第二章', course_order: 2 },
      ],
      loading: false,
      notFound: false,
    })
    renderAt('/course/qa-comm')
    expect(screen.getByText('QA 溝通課')).toBeInTheDocument()
    expect(screen.getByText('第一章')).toBeInTheDocument()
    expect(screen.getByText('第二章')).toBeInTheDocument()
    expect(screen.getByText('1 / 2 章已讀')).toBeInTheDocument()
  })

  it('shows not found message', () => {
    useCourse.mockReturnValue({ course: null, chapters: [], loading: false, notFound: true })
    renderAt('/course/missing')
    expect(screen.getByText('找不到課程')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/__tests__/CourseLanding.test.jsx`
Expected: FAIL — `CourseLanding` module does not exist.

- [ ] **Step 3: Implement the page**

Create `src/pages/CourseLanding.jsx`:

```jsx
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { useCourse } from '../hooks/useCourse'
import { useReadHistory } from '../hooks/useReadHistory'

export default function CourseLanding() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const preview = searchParams.get('preview') === '1'
  const { course, chapters, loading, notFound } = useCourse(slug, { preview })
  const { isRead } = useReadHistory()

  if (loading) return <div className="min-h-screen bg-white" />
  if (notFound || !course) {
    return (
      <>
        <Nav />
        <main className="max-w-3xl mx-auto px-6 py-24 text-center text-gray-500">找不到課程</main>
        <Footer />
      </>
    )
  }

  const qs = preview ? '?preview=1' : ''
  const readCount = chapters.filter(c => isRead(c.slug)).length

  return (
    <>
      <Helmet>
        <title>{course.title}</title>
        <link rel="canonical" href={`https://qa-lens.com/course/${slug}`} />
      </Helmet>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 sm:px-12 py-16">
        {course.cover_url && (
          <img src={course.cover_url} alt="" className="w-full rounded-xl mb-8 object-cover" />
        )}
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        {course.subtitle && <p className="text-lg text-gray-600 mb-4">{course.subtitle}</p>}
        {course.description && <p className="text-gray-600 leading-relaxed mb-8">{course.description}</p>}

        <p className="text-xs text-gray-400 mb-4">
          {readCount} / {chapters.length} 章已讀
        </p>

        <ol className="space-y-2">
          {chapters.map((c, i) => (
            <li key={c.slug}>
              <Link
                to={`/course/${slug}/${c.slug}${qs}`}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-300 w-6 flex-shrink-0">{i + 1}</span>
                <div className="w-14 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="flex-1 min-w-0 text-sm truncate">{c.title}</span>
                {isRead(c.slug) && <span className="text-xs text-green-600 flex-shrink-0">✓ 已讀</span>}
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/__tests__/CourseLanding.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/CourseLanding.jsx src/pages/__tests__/CourseLanding.test.jsx
git commit -m "feat(course): CourseLanding page"
```

---

## Task 5: CourseChapter page

**Files:**
- Create: `src/pages/CourseChapter.jsx`
- Test: `src/pages/__tests__/CourseChapter.test.jsx`

Fetches the single chapter post (full content) by `chapterSlug`, renders it via `MarkdownContent`, shows a top reading-progress bar, prev/next chapter nav (from `useCourse` chapters + `adjacentChapters`), and a back-to-course link. Marks the chapter read at high scroll progress.

- [ ] **Step 1: Write the failing render test**

Create `src/pages/__tests__/CourseChapter.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../hooks/useCourse', () => ({
  useCourse: vi.fn(),
  adjacentChapters: vi.fn(() => ({ prev: null, next: { slug: 'c2', title: '第二章' } })),
}))
vi.mock('../../hooks/useReadingProgress', () => ({ useReadingProgress: () => 0 }))
vi.mock('../../hooks/useReadHistory', () => ({
  useReadHistory: () => ({ isRead: () => false, markRead: vi.fn() }),
}))
vi.mock('../../components/MarkdownContent', () => ({
  default: ({ content }) => <div data-testid="md">{content}</div>,
}))
vi.mock('../../components/Nav', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: chapterPost, error: null }) }),
          single: () => Promise.resolve({ data: chapterPost, error: null }),
        }),
      }),
    }),
  },
}))

import { useCourse } from '../../hooks/useCourse'
import CourseChapter from '../CourseChapter'

const chapterPost = { slug: 'c1', title: '第一章', content: '# 第一章\n內文內容' }

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/course/:slug/:chapterSlug" element={<CourseChapter />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CourseChapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCourse.mockReturnValue({
      course: { title: 'QA 溝通課' },
      chapters: [{ slug: 'c1', title: '第一章' }, { slug: 'c2', title: '第二章' }],
      loading: false,
      notFound: false,
    })
  })

  it('renders chapter content and next-chapter nav', async () => {
    renderAt('/course/qa-comm/c1')
    await waitFor(() => expect(screen.getByTestId('md')).toBeInTheDocument())
    expect(screen.getByText('內文內容', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('第二章', { exact: false })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/__tests__/CourseChapter.test.jsx`
Expected: FAIL — `CourseChapter` module does not exist.

- [ ] **Step 3: Implement the page**

Create `src/pages/CourseChapter.jsx`:

```jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import MarkdownContent from '../components/MarkdownContent'
import { useCourse, adjacentChapters } from '../hooks/useCourse'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useReadHistory } from '../hooks/useReadHistory'

export default function CourseChapter() {
  const { slug, chapterSlug } = useParams()
  const [searchParams] = useSearchParams()
  const preview = searchParams.get('preview') === '1'
  const qs = preview ? '?preview=1' : ''

  const { course, chapters } = useCourse(slug, { preview })
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const progress = useReadingProgress()
  const { markRead } = useReadHistory()
  const markedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    markedRef.current = false
    let q = supabase.from('posts').select('*').eq('slug', chapterSlug)
    if (!preview) q = q.eq('published', true)
    q.single().then(({ data }) => {
      if (cancelled) return
      setPost(data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [chapterSlug, preview])

  useEffect(() => {
    if (progress >= 80 && !markedRef.current && chapterSlug) {
      markRead(chapterSlug)
      markedRef.current = true
    }
  }, [progress, chapterSlug, markRead])

  const { prev, next } = adjacentChapters(chapters, chapterSlug)

  if (loading) return <div className="min-h-screen bg-white" />
  if (!post) {
    return (
      <>
        <Nav />
        <main className="max-w-3xl mx-auto px-6 py-24 text-center text-gray-500">找不到章節</main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{post.title}{course ? ` — ${course.title}` : ''}</title>
        <link rel="canonical" href={`https://qa-lens.com/course/${slug}/${chapterSlug}`} />
      </Helmet>
      <div className="fixed top-0 left-0 h-0.5 bg-gray-900 z-50 transition-all" style={{ width: `${progress}%` }} />
      <Nav />
      <main className="max-w-3xl mx-auto px-6 sm:px-12 py-16">
        <Link to={`/course/${slug}${qs}`} className="text-xs text-gray-400 hover:text-gray-700 mb-6 inline-block">
          ← {course?.title ?? '課程'}
        </Link>
        <h1 className="text-2xl font-bold mb-8">{post.title}</h1>
        <MarkdownContent content={post.content?.replace(/^\s*#[^\n]*\n?/, '')} />

        <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
          {prev ? (
            <Link to={`/course/${slug}/${prev.slug}${qs}`} className="text-sm text-gray-600 hover:text-gray-900">
              ← {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/course/${slug}/${next.slug}${qs}`} className="text-sm text-gray-600 hover:text-gray-900 text-right">
              {next.title} →
            </Link>
          ) : <span />}
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 4: Add the missing supabase import**

The page references `supabase` — add to the import block at the top of `src/pages/CourseChapter.jsx`:

```jsx
import { supabase } from '../lib/supabase'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/pages/__tests__/CourseChapter.test.jsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/pages/CourseChapter.jsx src/pages/__tests__/CourseChapter.test.jsx
git commit -m "feat(course): CourseChapter reading page"
```

---

## Task 6: Wire routes into App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add lazy imports**

Near the other lazy course imports (`src/App.jsx:31-32`), add:

```jsx
const CourseLanding = lazy(() => import('./pages/CourseLanding'))
const CourseChapter = lazy(() => import('./pages/CourseChapter'))
```

- [ ] **Step 2: Add the two public routes**

In `AppRoutes`, after the `/blog/:slug` route (`src/App.jsx:102`), add:

```jsx
        <Route path="/course/:slug" element={<CourseLanding />} />
        <Route path="/course/:slug/:chapterSlug" element={<CourseChapter />} />
```

(No `HiddenRoute` wrapper — visibility is controlled by `courses.published` + the `?preview=1` gate inside the pages.)

- [ ] **Step 3: Verify build compiles**

Run: `npx vite build`
Expected: build succeeds, emits `CourseLanding` and `CourseChapter` chunks.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat(course): add /course routes"
```

---

## Task 7: Exclude course chapters from BlogPost navigation

**Files:**
- Modify: `src/pages/BlogPost.jsx`

Course chapters are course-exclusive; blog post prev/next and the tags-"系列" list must not surface them.

- [ ] **Step 1: Add `.is('course_id', null)` to prev/next queries**

In the "Prev/next" effect (`src/pages/BlogPost.jsx`, the two `supabase.from('posts')...` calls around lines 114-116), add `.is('course_id', null)` to each builder:

```jsx
      supabase.from('posts').select('title, slug').eq('published', true).is('course_id', null)
        .lt('published_at', post.published_at).order('published_at', { ascending: false }).limit(1),
      supabase.from('posts').select('title, slug').eq('published', true).is('course_id', null)
        .gt('published_at', post.published_at).order('published_at', { ascending: true }).limit(1),
```

- [ ] **Step 2: Add `.is('course_id', null)` to the series query**

In the "Series" effect (`src/pages/BlogPost.jsx` around line 128):

```jsx
    supabase.from('posts').select('title, slug, published_at')
      .eq('published', true).is('course_id', null).contains('tags', [seriesTag])
      .order('published_at', { ascending: true })
```

- [ ] **Step 3: Verify the full test suite still passes**

Run: `npx vitest run`
Expected: PASS — all existing tests plus the new course/usePosts tests.

- [ ] **Step 4: Commit**

```bash
git add src/pages/BlogPost.jsx
git commit -m "fix(blog): keep course chapters out of blog post navigation"
```

---

## Task 8: Admin preview buttons

**Files:**
- Modify: `src/pages/admin/AdminCourses.jsx`
- Modify: `src/pages/admin/AdminCourseEdit.jsx`

Give the author one-click access to the preview from the admin.

- [ ] **Step 1: Add a preview link to each row in AdminCourses**

In `src/pages/admin/AdminCourses.jsx`, the course row is a single `<Link>` to the edit page. Wrap the row content so the preview link sits alongside without nesting anchors. Replace the `courses.map(...)` block:

```jsx
        {courses.map(c => (
          <div key={c.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
            <Link to={`/admin/courses/${c.id}`} className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-20 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{c.title}</div>
                <div className="text-xs text-gray-500">{c.chapter_count} 章 · 順序 {c.display_order}</div>
              </div>
            </Link>
            <a href={`/course/${c.slug}?preview=1`} target="_blank" rel="noreferrer"
              className="text-xs border px-3 py-1.5 rounded hover:bg-gray-100 flex-shrink-0">預覽</a>
            <span className={`text-xs px-2 py-1 rounded ${c.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {c.published ? '已公開' : '未公開'}
            </span>
          </div>
        ))}
```

- [ ] **Step 2: Verify AdminCourses test still passes**

Run: `npx vitest run src/pages/admin/__tests__/AdminCourses.test.jsx`
Expected: PASS. If the existing test asserts the row is a link by role/href and now fails because the row is a `div`, update that assertion to query the edit `<Link>` by its `to`/text instead. Show the change in the commit.

- [ ] **Step 3: Add a preview button to AdminCourseEdit**

In `src/pages/admin/AdminCourseEdit.jsx`, in the `!isNew` branch near the chapters header (around line 100), add a preview link. After the `<h2>章節…</h2>` line inside the `!isNew` block, or next to the submit button, add:

```jsx
          <a href={`/course/${form.slug}?preview=1`} target="_blank" rel="noreferrer"
            className="inline-block text-xs border px-3 py-2 rounded mb-4 hover:bg-gray-100">預覽課程頁</a>
```

Place it just above the chapters `<div className="space-y-2">` list so it only shows for existing courses with a slug.

- [ ] **Step 3a: Verify build compiles**

Run: `npx vite build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminCourses.jsx src/pages/admin/AdminCourseEdit.jsx src/pages/admin/__tests__/AdminCourses.test.jsx
git commit -m "feat(admin): course preview links"
```

---

## Final Verification

- [ ] **Run the full test suite**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Manual smoke (preview an unpublished course)**

With `npm run dev`, open `/course/<a-course-slug>?preview=1`, confirm the landing lists chapters, click a chapter, confirm content renders, prev/next works, progress bar moves, back link returns to landing. Confirm `/blog` does not list course chapters.

---

## Notes / Out of Scope (follow-up)

- `functions/_middleware.js` bot full-text injection does not yet handle `/course/...` URLs. Add before the course goes public so AI crawlers don't get an empty shell. (See memory: dynamic-rendering.)
- Paywall / free-trial chapter gating.
- Desktop two-pane sidebar TOC enhancement.
