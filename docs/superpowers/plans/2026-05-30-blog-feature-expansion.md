# Blog Feature Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 features: admin reading time / clone / batch tags, BlogPost progress bar / TOC / related articles, and RSS feed.

**Architecture:** Three independent batches (A: admin-only, B: BlogPost UX, C: RSS). Shared utilities extracted to `src/lib/toc.js` and two new hooks. New components are self-contained files.

**Tech Stack:** React, Vite, Supabase, Tailwind CSS, ReactMarkdown, Vitest + @testing-library/react, Cloudflare Pages Functions

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/lib/toc.js` | `slugify()` and `parseHeadings()` utilities |
| Create | `src/lib/toc.test.js` | Unit tests for toc utilities |
| Create | `src/hooks/useReadingProgress.js` | Scroll % hook |
| Create | `src/hooks/useActiveHeading.js` | IntersectionObserver scroll-spy hook |
| Create | `src/components/TableOfContents.jsx` | TOC — mobile `<details>` + desktop list |
| Create | `src/components/RelatedPosts.jsx` | Related articles section |
| Create | `functions/rss.xml.js` | Cloudflare Pages Function for RSS |
| Modify | `src/components/MarkdownContent.jsx` | Inject `id` into h2/h3 when rendering |
| Modify | `src/pages/BlogPost.jsx` | Progress bar, TOC, RelatedPosts, grid layout |
| Modify | `src/pages/admin/AdminPosts.jsx` | Reading time col, clone btn, batch tag UI |

---

## Task 1: TOC utilities

**Files:**
- Create: `src/lib/toc.js`
- Create: `src/lib/toc.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/lib/toc.test.js
import { describe, it, expect } from 'vitest'
import { slugify, parseHeadings } from './toc'

describe('slugify', () => {
  it('lowercases ascii', () => expect(slugify('Hello World')).toBe('hello-world'))
  it('keeps chinese characters', () => expect(slugify('測試方法')).toBe('測試方法'))
  it('removes special chars', () => expect(slugify('A: B & C')).toBe('a-b--c'))
  it('trims and collapses spaces', () => expect(slugify('  foo  bar  ')).toBe('foo--bar'))
})

describe('parseHeadings', () => {
  it('extracts h2 and h3', () => {
    const md = '## First\n\nsome text\n\n### Sub\n\n## Second'
    expect(parseHeadings(md)).toEqual([
      { level: 2, text: 'First', id: 'first' },
      { level: 3, text: 'Sub', id: 'sub' },
      { level: 2, text: 'Second', id: 'second' },
    ])
  })
  it('ignores h1', () => {
    expect(parseHeadings('# Title\n## Section')).toHaveLength(1)
  })
  it('returns empty array for no headings', () => {
    expect(parseHeadings('just text')).toEqual([])
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npm run test:run -- src/lib/toc.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```js
// src/lib/toc.js
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s一-鿿-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function parseHeadings(markdown) {
  const matches = [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)]
  return matches.map(([, hashes, text]) => ({
    level: hashes.length,
    text: text.trim(),
    id: slugify(text.trim()),
  }))
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/lib/toc.test.js
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/toc.js src/lib/toc.test.js
git commit -m "feat: add toc utilities (slugify, parseHeadings)"
```

---

## Task 2: useReadingProgress hook

**Files:**
- Create: `src/hooks/useReadingProgress.js`

- [ ] **Step 1: Create hook**

```js
// src/hooks/useReadingProgress.js
import { useState, useEffect } from 'react'

export function useReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return progress
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useReadingProgress.js
git commit -m "feat: add useReadingProgress hook"
```

---

## Task 3: useActiveHeading hook

**Files:**
- Create: `src/hooks/useActiveHeading.js`

- [ ] **Step 1: Create hook**

```js
// src/hooks/useActiveHeading.js
import { useState, useEffect } from 'react'

export function useActiveHeading(headings) {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (!headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '0px 0px -75% 0px' }
    )
    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  return activeId
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useActiveHeading.js
git commit -m "feat: add useActiveHeading scroll-spy hook"
```

---

## Task 4: TableOfContents component

**Files:**
- Create: `src/components/TableOfContents.jsx`

- [ ] **Step 1: Create component**

```jsx
// src/components/TableOfContents.jsx
function TocList({ headings, activeId }) {
  return (
    <ul className="space-y-1.5">
      {headings.map(({ level, text, id }) => (
        <li key={id} className={level === 3 ? 'pl-3' : ''}>
          <a
            href={`#${id}`}
            className={`text-xs block transition-colors ${
              activeId === id
                ? 'text-gray-900 font-medium'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {text}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function TableOfContents({ headings, activeId = '', mobile = false }) {
  if (mobile) {
    return (
      <details className="border border-gray-100 rounded-xl p-4">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer select-none">
          目錄
        </summary>
        <nav className="mt-3">
          <TocList headings={headings} activeId={activeId} />
        </nav>
      </details>
    )
  }
  return (
    <nav>
      <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-widest">目錄</p>
      <TocList headings={headings} activeId={activeId} />
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TableOfContents.jsx
git commit -m "feat: add TableOfContents component"
```

---

## Task 5: RelatedPosts component

**Files:**
- Create: `src/components/RelatedPosts.jsx`

- [ ] **Step 1: Create component**

```jsx
// src/components/RelatedPosts.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RelatedPosts({ currentSlug, tags }) {
  const [related, setRelated] = useState([])

  useEffect(() => {
    if (!tags?.length) return
    supabase
      .from('posts')
      .select('id, title, slug, tags, excerpt')
      .eq('published', true)
      .neq('slug', currentSlug)
      .then(({ data }) => {
        if (!data) return
        const scored = data
          .map(p => ({
            ...p,
            score: (p.tags ?? []).filter(t => tags.includes(t)).length,
          }))
          .filter(p => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
        setRelated(scored)
      })
  }, [currentSlug, tags])

  if (!related.length) return null

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="text-sm font-semibold mb-6 text-gray-700">相關文章</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.map(p => (
          <Link
            key={p.id}
            to={`/blog/${p.slug}`}
            className="block p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors"
          >
            <p className="text-sm font-medium mb-2 line-clamp-2 text-gray-900">{p.title}</p>
            <div className="flex gap-1 flex-wrap mb-2">
              {(p.tags ?? []).slice(0, 2).map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RelatedPosts.jsx
git commit -m "feat: add RelatedPosts component"
```

---

## Task 6: Inject heading IDs in MarkdownContent

**Files:**
- Modify: `src/components/MarkdownContent.jsx`

- [ ] **Step 1: Add import and heading injection**

At the top of `src/components/MarkdownContent.jsx`, after the existing imports, add:

```js
import { slugify } from '../lib/toc'
```

Replace the `MdCode` definition block — add heading components after it:

```jsx
function MdH2({ children }) {
  return <h2 id={slugify(String(children))}>{children}</h2>
}
function MdH3({ children }) {
  return <h3 id={slugify(String(children))}>{children}</h3>
}
```

In the HTML branch, add a helper before the `return` statement inside the component:

```jsx
function addHeadingIds(html) {
  return html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (_, tag, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim()
    return `<${tag}${attrs} id="${slugify(text)}">${inner}</${tag}>`
  })
}
```

Update the `ReactMarkdown` component to pass the new heading components:

```jsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{ code: MdCode, h2: MdH2, h3: MdH3 }}
>
  {content ?? ''}
</ReactMarkdown>
```

Update the HTML branch `dangerouslySetInnerHTML`:

```jsx
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(addHeadingIds(content ?? '')) }}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MarkdownContent.jsx
git commit -m "feat: inject heading IDs into rendered markdown for TOC anchors"
```

---

## Task 7: Update BlogPost — progress bar, TOC, related articles

**Files:**
- Modify: `src/pages/BlogPost.jsx`

- [ ] **Step 1: Replace the entire file**

```jsx
// src/pages/BlogPost.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import MarkdownContent from '../components/MarkdownContent'
import TableOfContents from '../components/TableOfContents'
import RelatedPosts from '../components/RelatedPosts'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useActiveHeading } from '../hooks/useActiveHeading'
import { parseHeadings } from '../lib/toc'
import { supabase } from '../lib/supabase'

export default function BlogPost() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === '1'
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const progress = useReadingProgress()

  useEffect(() => {
    let query = supabase.from('posts').select('*').eq('slug', slug)
    if (!isPreview) query = query.eq('published', true)
    query.single().then(({ data }) => {
      setPost(data)
      setLoading(false)
    })
  }, [slug, isPreview])

  const headings = post?.content ? parseHeadings(post.content) : []
  const activeId = useActiveHeading(headings)

  if (loading) return (
    <>
      <div className="fixed top-0 left-0 h-[3px] bg-gray-900 z-50" style={{ width: `${progress}%` }} />
      <Nav />
      <div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">載入中…</div>
      <Footer />
    </>
  )
  if (!post) return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">找不到此文章。</div>
      <Footer />
    </>
  )

  const postUrl = `${window.location.origin}/blog/${slug}`
  const shareText = encodeURIComponent(post.title)
  const shareUrl = encodeURIComponent(postUrl)
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
  const xShare = `https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`

  return (
    <>
      <div
        className="fixed top-0 left-0 h-[3px] bg-gray-900 z-50 transition-none"
        style={{ width: `${progress}%` }}
      />
      <Helmet>
        <title>{post.title} | Jimmy Hong</title>
        <meta name="description" content={post.excerpt ?? ''} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt ?? ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
      </Helmet>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
        <div className={headings.length >= 2 ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-12' : ''}>
          <article>
            <div className="flex gap-2 flex-wrap mb-3">
              {(post.tags ?? []).map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
            <p className="text-xs text-gray-400 mb-10">
              {post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : ''}
            </p>
            {headings.length >= 2 && (
              <div className="lg:hidden mb-8">
                <TableOfContents headings={headings} activeId={activeId} mobile />
              </div>
            )}
            <MarkdownContent content={post.content} />
            <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-4">
              <span className="text-xs text-gray-400">分享：</span>
              <a href={linkedInShare} target="_blank" rel="noreferrer"
                className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">
                LinkedIn
              </a>
              <a href={xShare} target="_blank" rel="noreferrer"
                className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">
                X (Twitter)
              </a>
            </div>
            <RelatedPosts currentSlug={slug} tags={post.tags ?? []} />
            <div className="mt-8">
              <Link to="/blog" className="text-xs text-gray-400 hover:text-gray-700">← 回文章列表</Link>
            </div>
          </article>
          {headings.length >= 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents headings={headings} activeId={activeId} />
              </div>
            </aside>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/BlogPost.jsx
git commit -m "feat: add reading progress bar, TOC, and related articles to BlogPost"
```

---

## Task 8: Admin — reading time, clone, batch tags

**Files:**
- Modify: `src/pages/admin/AdminPosts.jsx`

- [ ] **Step 1: Add reading time helper and update fetch query**

At the top of the component (after existing state declarations), add:

```js
function readingTime(content) {
  if (!content) return 1
  return Math.max(1, Math.ceil(content.replace(/\s/g, '').length / 400))
}
```

Change `fetchPosts` select to include `content`:

```js
async function fetchPosts() {
  const { data } = await supabase
    .from('posts')
    .select('id, title, tags, published, published_at, content')
    .order('created_at', { ascending: false })
  setPosts(data ?? [])
  setSelectedIds(new Set())
}
```

- [ ] **Step 2: Add clone handler**

After `handleDelete`:

```js
async function handleClone(post) {
  const { data } = await supabase
    .from('posts')
    .insert({
      title: post.title + '（複製）',
      slug: post.slug + '-copy-' + Date.now(),
      content: post.content,
      excerpt: post.excerpt ?? '',
      tags: post.tags ?? [],
      published: false,
      published_at: null,
    })
    .select('id')
    .single()
  if (data?.id) window.location.href = `/admin/posts/${data.id}`
}
```

- [ ] **Step 3: Add batch tag state and handler**

After existing state declarations, add:

```js
const [batchTagInput, setBatchTagInput] = useState('')
```

After `handleBatchDelete`, add:

```js
async function handleBatchTag(mode) {
  const newTags = batchTagInput.split(',').map(t => t.trim()).filter(Boolean)
  if (!newTags.length) return
  const selected = posts.filter(p => selectedIds.has(p.id))
  await Promise.all(selected.map(p => {
    const tags = mode === 'append'
      ? [...new Set([...(p.tags ?? []), ...newTags])]
      : newTags
    return supabase.from('posts').update({ tags }).eq('id', p.id)
  }))
  setBatchTagInput('')
  fetchPosts()
}
```

- [ ] **Step 4: Update table header — add 時間 column**

In the `<thead>`, after the 標題 th and before 標籤:

```jsx
<th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">時間</th>
```

- [ ] **Step 5: Update table row — add reading time cell and clone button**

In each `<tr>`, after the 標題 `<td>` and before 標籤 `<td>`:

```jsx
<td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
  {readingTime(post.content)} 分鐘
</td>
```

In the actions `<td>`, add clone button before 編輯:

```jsx
<button onClick={() => handleClone(post)}
  className="text-xs border border-gray-200 px-3 py-1 rounded hover:border-gray-400">複製</button>
```

- [ ] **Step 6: Update batch action bar — add tag inputs**

Inside the batch action bar `<div>`, after the 刪除 button, add:

```jsx
<div className="w-px h-4 bg-gray-300 mx-1" />
<input
  type="text"
  placeholder="標籤，用逗號分隔"
  value={batchTagInput}
  onChange={e => setBatchTagInput(e.target.value)}
  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400 w-48"
/>
<button onClick={() => handleBatchTag('append')}
  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
  追加
</button>
<button onClick={() => handleBatchTag('replace')}
  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
  取代
</button>
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/AdminPosts.jsx
git commit -m "feat: add reading time, clone button, and batch tag management to AdminPosts"
```

---

## Task 9: RSS feed — Cloudflare Pages Function

**Files:**
- Create: `functions/rss.xml.js`

- [ ] **Step 1: Create function**

```js
// functions/rss.xml.js
const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
const SITE_URL = 'https://jimmy-hong-portfolio.pages.dev'

export async function onRequest() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/posts?select=title,slug,excerpt,published_at&published=eq.true&order=published_at.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  const posts = await res.json()

  const items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid>
      <description><![CDATA[${p.excerpt ?? ''}]]></description>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Jimmy Hong | QA Blog</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>關於 QA 流程、測試策略、自動化的技術文章。</description>
    <language>zh-TW</language>${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/rss.xml.js
git commit -m "feat: add RSS feed via Cloudflare Pages Function"
```

---

## Task 10: Final push + smoke check

- [ ] **Step 1: Run tests**

```bash
npm run test:run
```

Expected: all tests pass (including the new `toc.test.js`).

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no errors, `dist/` generated.

- [ ] **Step 3: Push to trigger Cloudflare Pages deployment**

```bash
git push origin main
```

- [ ] **Step 4: Verify RSS feed**

After deployment completes, open `https://jimmy-hong-portfolio.pages.dev/rss.xml` in a browser.
Expected: valid RSS XML with published articles.

- [ ] **Step 5: Verify BlogPost features**

Open any published blog post. Verify:
1. Progress bar appears at top and fills as you scroll
2. TOC appears in sidebar (desktop) or as `<details>` (mobile)
3. Related articles section appears at the bottom

- [ ] **Step 6: Verify admin features**

Open `/admin/posts`. Verify:
1. 時間 column shows reading minutes
2. 複製 button on each row
3. Select posts → batch action bar shows tag input + 追加/取代 buttons
