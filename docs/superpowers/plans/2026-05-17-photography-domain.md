# Photography Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a photography portfolio domain at `/photo` and `/photo/:id` for the studio brand "r.bing recording", with independent navigation, image gallery support, and admin management.

**Architecture:** New pages under `src/pages/photo/` use an independent `PhotoNav` component instead of the existing `Nav`. Photo projects are stored in the `photo_projects` Supabase table (already created). Admin pages follow identical patterns to existing `AdminProjects` / `AdminProjectEdit`. Gallery images are stored as `text[]` (one URL per line in admin textarea). Routes added to `App.jsx`; `AdminLayout.jsx` sidebar gets a new link.

**Tech Stack:** React 18, React Router v6, Tailwind CSS, Supabase JS v2, Vitest + @testing-library/react

---

## File Map

```
src/
├── components/
│   ├── PhotoNav.jsx                          # CREATE — independent nav for /photo/* pages
│   └── PhotoCard.jsx                         # CREATE — card for photo project grid
├── hooks/
│   └── usePhotoProjects.js                   # CREATE — fetch from photo_projects table
├── pages/photo/
│   ├── PhotoHome.jsx                         # CREATE — Hero + grid + Services
│   └── PhotoDetail.jsx                       # CREATE — gallery + Markdown
└── pages/admin/
    ├── AdminPhotoProjects.jsx                # CREATE — list + delete
    └── AdminPhotoProjectEdit.jsx             # CREATE — create/edit form

src/components/__tests__/
├── PhotoNav.test.jsx                         # CREATE
└── PhotoCard.test.jsx                        # CREATE
src/hooks/__tests__/
└── usePhotoProjects.test.js                  # CREATE

src/pages/admin/AdminLayout.jsx               # MODIFY — add 攝影作品 sidebar link
src/App.jsx                                   # MODIFY — add /photo routes + admin routes
```

---

## Task 1: `usePhotoProjects` hook

**Files:**
- Create: `src/hooks/usePhotoProjects.js`
- Create: `src/hooks/__tests__/usePhotoProjects.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/hooks/__tests__/usePhotoProjects.test.js
import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import { usePhotoProjects } from '../usePhotoProjects'

const mockProjects = [
  { id: '1', title: 'Portrait A', tags: ['人像'], display_order: 0 },
  { id: '2', title: 'Event B', tags: ['活動'], display_order: 1 },
]

describe('usePhotoProjects', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
    })
  })

  it('returns all photo projects when no tag filter', async () => {
    const { result } = renderHook(() => usePhotoProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/hooks/__tests__/usePhotoProjects.test.js
```
Expected: FAIL with "Cannot find module '../usePhotoProjects'"

- [ ] **Step 3: Implement the hook**

```js
// src/hooks/usePhotoProjects.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePhotoProjects(tag = null) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setError(null)

    let query = supabase
      .from('photo_projects')
      .select('id, title, description, tags, cover_url, display_order')

    if (tag) {
      query = query.contains('tags', [tag])
    }

    query.order('display_order', { ascending: true }).then(({ data, error }) => {
      if (cancelled) return
      if (error) setError(error.message)
      else setProjects(data ?? [])
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [tag])

  return { projects, loading, error }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/hooks/__tests__/usePhotoProjects.test.js
```
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePhotoProjects.js src/hooks/__tests__/usePhotoProjects.test.js
git commit -m "feat: add usePhotoProjects hook"
```

---

## Task 2: `PhotoCard` component

**Files:**
- Create: `src/components/PhotoCard.jsx`
- Create: `src/components/__tests__/PhotoCard.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/__tests__/PhotoCard.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import PhotoCard from '../PhotoCard'

const mockProject = {
  id: 'abc123',
  title: 'Wedding Series',
  tags: ['人像', '婚禮'],
  cover_url: 'https://example.com/photo.jpg',
}

describe('PhotoCard', () => {
  it('renders title', () => {
    render(<MemoryRouter><PhotoCard project={mockProject} /></MemoryRouter>)
    expect(screen.getByText('Wedding Series')).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<MemoryRouter><PhotoCard project={mockProject} /></MemoryRouter>)
    expect(screen.getByText('人像')).toBeInTheDocument()
    expect(screen.getByText('婚禮')).toBeInTheDocument()
  })

  it('links to /photo/:id', () => {
    render(<MemoryRouter><PhotoCard project={mockProject} /></MemoryRouter>)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/photo/abc123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/__tests__/PhotoCard.test.jsx
```
Expected: FAIL with "Cannot find module '../PhotoCard'"

- [ ] **Step 3: Implement the component**

```jsx
// src/components/PhotoCard.jsx
import { Link } from 'react-router-dom'

export default function PhotoCard({ project }) {
  return (
    <Link to={`/photo/${project.id}`} className="block border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {project.cover_url ? (
        <img src={project.cover_url} alt={project.title} className="w-full aspect-[4/3] object-cover" />
      ) : (
        <div className="w-full aspect-[4/3] bg-gray-100" />
      )}
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">{project.title}</h3>
        <div className="flex gap-1 flex-wrap">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/components/__tests__/PhotoCard.test.jsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/PhotoCard.jsx src/components/__tests__/PhotoCard.test.jsx
git commit -m "feat: add PhotoCard component"
```

---

## Task 3: `PhotoNav` component

**Files:**
- Create: `src/components/PhotoNav.jsx`
- Create: `src/components/__tests__/PhotoNav.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/__tests__/PhotoNav.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: { email: 'test@example.com' } }),
}))

import PhotoNav from '../PhotoNav'

describe('PhotoNav', () => {
  it('renders studio name linking to /photo', () => {
    render(<MemoryRouter><PhotoNav /></MemoryRouter>)
    const logo = screen.getByText('r.bing recording')
    expect(logo.closest('a')).toHaveAttribute('href', '/photo')
  })

  it('renders link back to QA site', () => {
    render(<MemoryRouter><PhotoNav /></MemoryRouter>)
    expect(screen.getByText('QA 網站')).toBeInTheDocument()
  })

  it('renders contact button when email is set', () => {
    render(<MemoryRouter><PhotoNav /></MemoryRouter>)
    expect(screen.getByText('聯絡我')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/__tests__/PhotoNav.test.jsx
```
Expected: FAIL with "Cannot find module '../PhotoNav'"

- [ ] **Step 3: Implement the component**

```jsx
// src/components/PhotoNav.jsx
import { Link } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

export default function PhotoNav() {
  const { settings } = useSettings()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-12 py-5 flex items-center justify-between">
        <Link to="/photo" className="text-sm font-semibold tracking-wide">r.bing recording</Link>
        <div className="flex items-center gap-6">
          <a
            href="https://www.instagram.com/r.bing_recording/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Instagram
          </a>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">QA 網站</Link>
          {settings.email && (
            <a
              href={`mailto:${settings.email}`}
              className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              聯絡我
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/components/__tests__/PhotoNav.test.jsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/PhotoNav.jsx src/components/__tests__/PhotoNav.test.jsx
git commit -m "feat: add PhotoNav component for photography domain"
```

---

## Task 4: `PhotoHome` page

**Files:**
- Create: `src/pages/photo/PhotoHome.jsx`

No new tests for this page (integration of already-tested components).

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p /Users/jimmyhong/Desktop/qa_self_blog/src/pages/photo
```

- [ ] **Step 2: Implement PhotoHome**

```jsx
// src/pages/photo/PhotoHome.jsx
import PhotoNav from '../../components/PhotoNav'
import Footer from '../../components/Footer'
import SEOHead from '../../components/SEOHead'
import PhotoCard from '../../components/PhotoCard'
import { usePhotoProjects } from '../../hooks/usePhotoProjects'
import { useSettings } from '../../hooks/useSettings'

const PHOTO_SERVICES = [
  { icon: '📸', title: '人像攝影', desc: '個人形象照、畢業照、情侶寫真' },
  { icon: '🎪', title: '活動紀錄', desc: '演唱會、展覽、品牌活動現場攝影' },
  { icon: '🏢', title: '商業攝影', desc: '商品拍攝、品牌視覺、空間攝影' },
]

export default function PhotoHome() {
  const { projects, loading } = usePhotoProjects()
  const { settings } = useSettings()

  return (
    <>
      <SEOHead title="r.bing recording" description="用鏡頭記錄真實的瞬間。" />
      <PhotoNav />
      <main>
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-12 py-20">
          <div className="flex gap-7 items-start mb-16">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden ring-2 ring-gray-100 ring-offset-2">
              <img
                src={settings.avatar_url || '/avatar.jpg'}
                alt="r.bing recording"
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
            <div>
              <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">Photography Studio</p>
              <h1 className="text-3xl font-bold mb-1">r.bing recording</h1>
              <p className="text-sm text-gray-500 mb-4">用鏡頭記錄真實的瞬間</p>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                專注人像與生活紀錄攝影。<br />
                每一張照片都是一個故事的開始。
              </p>
              <div className="flex items-center gap-3">
                {settings.email && (
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700"
                  >
                    預約洽詢
                  </a>
                )}
                <a
                  href="https://www.instagram.com/r.bing_recording/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400"
                >
                  ig
                </a>
              </div>
            </div>
          </div>

          {/* Projects grid */}
          <div className="mb-16">
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Portfolio</p>
            <h2 className="text-xl font-bold mb-8">攝影作品</h2>
            {loading ? (
              <p className="text-sm text-gray-400">載入中…</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-gray-400">尚無作品。</p>
            ) : (
              <div className="grid grid-cols-3 gap-5">
                {projects.map(p => <PhotoCard key={p.id} project={p} />)}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">合作方式</p>
            <h2 className="text-xl font-bold mb-8">Services</h2>
            <div className="grid grid-cols-3 gap-5">
              {PHOTO_SERVICES.map(s => (
                <div key={s.title} className="border border-gray-200 rounded-xl p-6">
                  <div className="text-2xl mb-3">{s.icon}</div>
                  <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors (chunk size warning is non-blocking)

- [ ] **Step 4: Commit**

```bash
git add src/pages/photo/PhotoHome.jsx
git commit -m "feat: add PhotoHome page"
```

---

## Task 5: `PhotoDetail` page

**Files:**
- Create: `src/pages/photo/PhotoDetail.jsx`

- [ ] **Step 1: Implement PhotoDetail**

```jsx
// src/pages/photo/PhotoDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PhotoNav from '../../components/PhotoNav'
import Footer from '../../components/Footer'
import SEOHead from '../../components/SEOHead'
import MarkdownContent from '../../components/MarkdownContent'
import { supabase } from '../../lib/supabase'

export default function PhotoDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('photo_projects')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProject(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <>
      <PhotoNav />
      <div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">載入中…</div>
      <Footer />
    </>
  )

  if (!project) return (
    <>
      <PhotoNav />
      <div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">找不到此作品。</div>
      <Footer />
    </>
  )

  return (
    <>
      <SEOHead title={project.title} description={project.description} />
      <PhotoNav />
      <main className="max-w-3xl mx-auto px-12 py-16">
        <div className="flex gap-2 flex-wrap mb-3">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-8">{project.title}</h1>

        {/* Image gallery */}
        {(project.images ?? []).length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-10">
            {project.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${project.title} ${i + 1}`}
                className="w-full rounded-xl object-cover aspect-[4/3] border border-gray-100"
              />
            ))}
          </div>
        )}

        <MarkdownContent content={project.content} />

        <div className="mt-12">
          <Link to="/photo" className="text-xs text-gray-400 hover:text-gray-700">← 返回作品集</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/photo/PhotoDetail.jsx
git commit -m "feat: add PhotoDetail page with image gallery"
```

---

## Task 6: Admin photo management

**Files:**
- Create: `src/pages/admin/AdminPhotoProjects.jsx`
- Create: `src/pages/admin/AdminPhotoProjectEdit.jsx`

- [ ] **Step 1: Implement AdminPhotoProjects**

```jsx
// src/pages/admin/AdminPhotoProjects.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminPhotoProjects() {
  const [projects, setProjects] = useState([])

  async function fetchProjects() {
    const { data } = await supabase
      .from('photo_projects')
      .select('id, title, tags, display_order')
      .order('display_order', { ascending: true })
    setProjects(data ?? [])
  }

  useEffect(() => { fetchProjects() }, [])

  async function handleDelete(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('photo_projects').delete().eq('id', id)
    fetchProjects()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-lg font-bold">攝影作品管理</h1>
        <Link to="/admin/photo-projects/new" className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          + 新增作品
        </Link>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標題</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標籤</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">排序</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-sm">{p.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {(p.tags ?? []).map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{p.display_order}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/admin/photo-projects/${p.id}`} className="text-xs border border-gray-200 px-3 py-1 rounded hover:border-gray-400">編輯</Link>
                    <button onClick={() => handleDelete(p.id)} className="text-xs border border-red-100 text-red-500 px-3 py-1 rounded hover:border-red-300">刪除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement AdminPhotoProjectEdit**

```jsx
// src/pages/admin/AdminPhotoProjectEdit.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminPhotoProjectEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', description: '', content: '',
    cover_url: '', images: '', tags: '', display_order: 0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) {
      supabase.from('photo_projects').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({
          ...data,
          tags: (data.tags ?? []).join(', '),
          images: (data.images ?? []).join('\n'),
        })
      })
    }
  }, [id, isNew])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description,
      content: form.content,
      cover_url: form.cover_url || null,
      images: form.images.split('\n').map(u => u.trim()).filter(Boolean),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      display_order: Number(form.display_order),
    }
    if (isNew) {
      await supabase.from('photo_projects').insert(payload)
    } else {
      await supabase.from('photo_projects').update(payload).eq('id', id)
    }
    navigate('/admin/photo-projects')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold mb-7">{isNew ? '新增攝影作品' : '編輯攝影作品'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標題</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">描述（簡短說明）</label>
          <input name="description" value={form.description} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標籤（逗號分隔）</label>
          <input name="tags" value={form.tags} onChange={handleChange}
            placeholder="人像, 商業, 風景"
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">封面圖片 URL</label>
          <input name="cover_url" value={form.cover_url} onChange={handleChange}
            placeholder="https://..."
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Gallery 圖片 URL（每行一個）</label>
          <textarea name="images" value={form.images} onChange={handleChange} rows={6}
            placeholder={"https://r2.example.com/photo1.jpg\nhttps://r2.example.com/photo2.jpg"}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 font-mono" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容（Markdown，拍攝故事說明）</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={10}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 font-mono" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">排序（數字越小越前面）</label>
          <input name="display_order" type="number" value={form.display_order} onChange={handleChange}
            className="w-32 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
          <button type="button" onClick={() => navigate('/admin/photo-projects')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminPhotoProjects.jsx src/pages/admin/AdminPhotoProjectEdit.jsx
git commit -m "feat: add Admin photo projects management (list, create, edit, delete)"
```

---

## Task 7: Wire routes — AdminLayout + App.jsx

**Files:**
- Modify: `src/pages/admin/AdminLayout.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add 攝影作品 to AdminLayout sidebar**

In `src/pages/admin/AdminLayout.jsx`, add after the `🗂 作品集管理` NavLink and before the `⚙️ 個人設定` NavLink:

```jsx
<NavLink
  to="/admin/photo-projects"
  className={({ isActive }) =>
    `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
  }
>
  📷 攝影作品
</NavLink>
```

The full nav section in AdminLayout should look like:

```jsx
<nav className="flex flex-col gap-1 flex-1">
  <NavLink
    to="/admin/posts"
    className={({ isActive }) =>
      `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
    }
  >
    📝 文章管理
  </NavLink>
  <NavLink
    to="/admin/projects"
    className={({ isActive }) =>
      `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
    }
  >
    🗂 作品集管理
  </NavLink>
  <NavLink
    to="/admin/photo-projects"
    className={({ isActive }) =>
      `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
    }
  >
    📷 攝影作品
  </NavLink>
  <NavLink
    to="/admin/settings"
    className={({ isActive }) =>
      `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
    }
  >
    ⚙️ 個人設定
  </NavLink>
</nav>
```

- [ ] **Step 2: Add routes to App.jsx**

Add imports at top of `src/App.jsx`:

```jsx
import PhotoHome from './pages/photo/PhotoHome'
import PhotoDetail from './pages/photo/PhotoDetail'
import AdminPhotoProjects from './pages/admin/AdminPhotoProjects'
import AdminPhotoProjectEdit from './pages/admin/AdminPhotoProjectEdit'
```

Add public routes before the `/admin` route:

```jsx
<Route path="/photo" element={<PhotoHome />} />
<Route path="/photo/:id" element={<PhotoDetail />} />
```

Add admin routes inside the `/admin` nested `<Route>` block (after the `settings` route):

```jsx
<Route path="photo-projects" element={<AdminPhotoProjects />} />
<Route path="photo-projects/:id" element={<AdminPhotoProjectEdit />} />
```

The complete `App.jsx` should be:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import About from './pages/About'
import Login from './pages/Login'
import PhotoHome from './pages/photo/PhotoHome'
import PhotoDetail from './pages/photo/PhotoDetail'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './pages/admin/AdminLayout'
import AdminPosts from './pages/admin/AdminPosts'
import AdminPostEdit from './pages/admin/AdminPostEdit'
import AdminProjects from './pages/admin/AdminProjects'
import AdminProjectEdit from './pages/admin/AdminProjectEdit'
import AdminSettings from './pages/admin/AdminSettings'
import AdminPhotoProjects from './pages/admin/AdminPhotoProjects'
import AdminPhotoProjectEdit from './pages/admin/AdminPhotoProjectEdit'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/photo" element={<PhotoHome />} />
          <Route path="/photo/:id" element={<PhotoDetail />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/posts" replace />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="posts/:id" element={<AdminPostEdit />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="projects/:id" element={<AdminProjectEdit />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="photo-projects" element={<AdminPhotoProjects />} />
            <Route path="photo-projects/:id" element={<AdminPhotoProjectEdit />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm run test:run
```
Expected: All tests pass (previous 9 + new 7 = 16 total)

- [ ] **Step 4: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors

- [ ] **Step 5: Commit and push**

```bash
git add src/pages/admin/AdminLayout.jsx src/App.jsx
git commit -m "feat: wire photography domain routes — /photo + /admin/photo-projects"
git push
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| `/photo` route + PhotoHome | Task 4, 7 |
| `/photo/:id` route + PhotoDetail | Task 5, 7 |
| `photo_projects` table (already created in Supabase) | pre-condition |
| `usePhotoProjects` hook | Task 1 |
| `PhotoNav` with r.bing recording brand | Task 3 |
| `PhotoCard` component | Task 2 |
| Image gallery grid in PhotoDetail | Task 5 |
| MarkdownContent in PhotoDetail | Task 5 |
| Admin: list + delete | Task 6 |
| Admin: create/edit with images textarea | Task 6 |
| AdminLayout sidebar 攝影作品 link | Task 7 |
| Back link ← 返回作品集 | Task 5 |
| SEO title per page | Task 4, 5 |
| PHOTO_SERVICES hardcoded in PhotoHome | Task 4 |
