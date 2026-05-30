# Admin Posts Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add search/filter, batch publish/unpublish/delete, auto-save, and a preview button to the admin posts interface.

**Architecture:** All changes are in two files: `AdminPosts.jsx` gains client-side filtering state (`search`, `statusFilter`, `tagFilter`) and batch selection state (`selectedIds` Set); `AdminPostEdit.jsx` gains a 30-second debounced auto-save effect and a preview button. No new components or routes needed.

**Tech Stack:** React 18, Supabase JS client, vitest + @testing-library/react.

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/pages/admin/AdminPosts.jsx` |
| Create | `src/pages/admin/__tests__/AdminPosts.test.jsx` |
| Modify | `src/pages/admin/AdminPostEdit.jsx` |
| Create | `src/pages/admin/__tests__/AdminPostEdit.test.jsx` |

---

## Task 1: AdminPosts — Search + Filter

**Files:**
- Modify: `src/pages/admin/AdminPosts.jsx`
- Create: `src/pages/admin/__tests__/AdminPosts.test.jsx`

- [ ] **Step 1: Create test directory and write failing tests**

```bash
mkdir -p src/pages/admin/__tests__
```

Create `src/pages/admin/__tests__/AdminPosts.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminPosts from '../AdminPosts'

const POSTS = [
  { id: '1', title: 'Appium 文章', tags: ['自動化測試', '工具'], published: true, published_at: '2024-01-01T00:00:00Z' },
  { id: '2', title: 'k6 效能測試', tags: ['效能測試'], published: true, published_at: '2024-01-02T00:00:00Z' },
  { id: '3', title: 'API 測試策略', tags: ['API 測試'], published: false, published_at: null },
]

function makeSupabaseMock(data = POSTS) {
  const inMock = vi.fn().mockResolvedValue({})
  const eqDeleteMock = vi.fn().mockResolvedValue({})
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data }),
      delete: vi.fn(() => ({ eq: eqDeleteMock, in: inMock })),
      update: vi.fn(() => ({ in: inMock })),
    })),
  }
}

vi.mock('../../../lib/supabase', () => ({ supabase: makeSupabaseMock() }))

import { supabase } from '../../../lib/supabase'

function renderPosts() {
  return render(<MemoryRouter><AdminPosts /></MemoryRouter>)
}

describe('AdminPosts — search and filter', () => {
  it('renders all posts on load', async () => {
    renderPosts()
    await waitFor(() => {
      expect(screen.getByText('Appium 文章')).toBeInTheDocument()
      expect(screen.getByText('k6 效能測試')).toBeInTheDocument()
      expect(screen.getByText('API 測試策略')).toBeInTheDocument()
    })
  })

  it('filters posts by search query', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('Appium 文章'))
    fireEvent.change(screen.getByPlaceholderText('🔍 搜尋標題…'), { target: { value: 'k6' } })
    expect(screen.queryByText('Appium 文章')).toBeNull()
    expect(screen.getByText('k6 效能測試')).toBeInTheDocument()
  })

  it('filters posts by draft status', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('Appium 文章'))
    fireEvent.click(screen.getByText('草稿'))
    expect(screen.queryByText('Appium 文章')).toBeNull()
    expect(screen.getByText('API 測試策略')).toBeInTheDocument()
  })

  it('filters posts by published status', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('API 測試策略'))
    fireEvent.click(screen.getByText('已發布'))
    expect(screen.queryByText('API 測試策略')).toBeNull()
    expect(screen.getByText('Appium 文章')).toBeInTheDocument()
  })

  it('populates tag filter with unique tags', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('Appium 文章'))
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('API 測試')).toBeInTheDocument()
    expect(screen.getByText('效能測試')).toBeInTheDocument()
    expect(screen.getByText('自動化測試')).toBeInTheDocument()
  })

  it('filters posts by tag', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('Appium 文章'))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '效能測試' } })
    expect(screen.queryByText('Appium 文章')).toBeNull()
    expect(screen.getByText('k6 效能測試')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/pages/admin/__tests__/AdminPosts.test.jsx
```

Expected: FAIL (AdminPosts doesn't have search/filter yet).

- [ ] **Step 3: Rewrite AdminPosts.jsx with search + filter**

Replace the entire content of `src/pages/admin/AdminPosts.jsx` with:

```jsx
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminPosts() {
  const [posts, setPosts] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('id, title, tags, published, published_at')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setSelectedIds(new Set())
  }

  useEffect(() => { fetchPosts() }, [])

  const allTags = useMemo(() => {
    const tags = new Set()
    posts.forEach(p => (p.tags ?? []).forEach(t => tags.add(t)))
    return [...tags].sort()
  }, [posts])

  const visiblePosts = useMemo(() => posts.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' ? true
      : statusFilter === 'published' ? p.published : !p.published
    const matchTag = !tagFilter || (p.tags ?? []).includes(tagFilter)
    return matchSearch && matchStatus && matchTag
  }), [posts, search, statusFilter, tagFilter])

  const allVisibleSelected = visiblePosts.length > 0 && visiblePosts.every(p => selectedIds.has(p.id))

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visiblePosts.map(p => p.id)))
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBatchPublish(published) {
    await supabase.from('posts')
      .update({ published, published_at: published ? new Date().toISOString() : null })
      .in('id', [...selectedIds])
    fetchPosts()
  }

  async function handleBatchDelete() {
    if (!confirm(`確定刪除 ${selectedIds.size} 篇文章？`)) return
    await supabase.from('posts').delete().in('id', [...selectedIds])
    fetchPosts()
  }

  async function handleDelete(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('posts').delete().eq('id', id)
    fetchPosts()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg font-bold">文章管理</h1>
        <Link to="/admin/posts/new"
          className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          + 新增文章
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input type="text" placeholder="🔍 搜尋標題…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 flex-1 min-w-[160px]" />
        <div className="flex gap-1">
          {[['all', '全部'], ['draft', '草稿'], ['published', '已發布']].map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                statusFilter === val ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:border-gray-400'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400">
          <option value="">全部標籤</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-8">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
              </th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標題</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標籤</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">狀態</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">日期</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visiblePosts.map(post => (
              <tr key={post.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.has(post.id)}
                    onChange={() => toggleSelect(post.id)} />
                </td>
                <td className="px-4 py-3 text-sm">{post.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {(post.tags ?? []).map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {post.published
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">已發布</span>
                    : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">草稿</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/admin/posts/${post.id}`}
                      className="text-xs border border-gray-200 px-3 py-1 rounded hover:border-gray-400">編輯</Link>
                    <button onClick={() => handleDelete(post.id)}
                      className="text-xs border border-red-100 text-red-500 px-3 py-1 rounded hover:border-red-300">刪除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <span className="text-sm text-gray-600">已選 {selectedIds.size} 篇</span>
          <button onClick={() => handleBatchPublish(true)}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
            發布
          </button>
          <button onClick={() => handleBatchPublish(false)}
            className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600">
            取消發布
          </button>
          <button onClick={handleBatchDelete}
            className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600">
            刪除
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/pages/admin/__tests__/AdminPosts.test.jsx
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminPosts.jsx src/pages/admin/__tests__/AdminPosts.test.jsx
git commit -m "feat: add search, filter, and batch operations to AdminPosts"
```

---

## Task 2: AdminPostEdit — Auto-Save + Preview Button

**Files:**
- Modify: `src/pages/admin/AdminPostEdit.jsx`
- Create: `src/pages/admin/__tests__/AdminPostEdit.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/pages/admin/__tests__/AdminPostEdit.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'abc',
          title: '測試文章',
          slug: 'test-article',
          content: '<p>內容</p>',
          excerpt: '摘要',
          tags: ['測試策略'],
          published: false,
          published_at: null,
        }
      }),
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({}) })),
      insert: vi.fn().mockResolvedValue({}),
    })),
  }
}))

vi.mock('../../../components/RichTextEditor', () => ({
  default: ({ value, onChange }) => (
    <textarea data-testid="rich-editor" value={value} onChange={e => onChange(e.target.value)} />
  )
}))

import AdminPostEdit from '../AdminPostEdit'
import { supabase } from '../../../lib/supabase'

function renderEdit(id = 'abc') {
  return render(
    <MemoryRouter initialEntries={[`/admin/posts/${id}`]}>
      <Routes>
        <Route path="/admin/posts/:id" element={<AdminPostEdit />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminPostEdit — auto-save and preview', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows preview button for existing post', async () => {
    renderEdit('abc')
    await waitFor(() => screen.getByDisplayValue('測試文章'))
    expect(screen.getByText('預覽')).toBeInTheDocument()
  })

  it('does not show preview button for new post', () => {
    renderEdit('new')
    expect(screen.queryByText('預覽')).toBeNull()
  })

  it('preview button opens /blog/:slug in new tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderEdit('abc')
    await waitFor(() => screen.getByText('預覽'))
    fireEvent.click(screen.getByText('預覽'))
    expect(open).toHaveBeenCalledWith('/blog/test-article', '_blank')
    open.mockRestore()
  })

  it('auto-saves after 30 seconds of inactivity', async () => {
    vi.useFakeTimers()
    renderEdit('abc')
    await act(async () => { await Promise.resolve() })
    await waitFor(() => screen.getByDisplayValue('測試文章'))

    // Simulate user changing the title
    fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
      target: { value: '修改後的標題' }
    })

    // Shows pending state
    expect(screen.getByText('• 未儲存變更')).toBeInTheDocument()

    // Advance 30 seconds
    await act(async () => { vi.advanceTimersByTime(30000) })
    await act(async () => { await Promise.resolve() })

    expect(supabase.from).toHaveBeenCalledWith('posts')
    vi.useRealTimers()
  })

  it('shows auto-saved timestamp after save completes', async () => {
    vi.useFakeTimers()
    renderEdit('abc')
    await act(async () => { await Promise.resolve() })
    await waitFor(() => screen.getByDisplayValue('測試文章'))

    fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
      target: { value: '新標題' }
    })

    await act(async () => { vi.advanceTimersByTime(30000) })
    await act(async () => { await Promise.resolve() })

    await waitFor(() => {
      expect(screen.getByText(/已自動儲存/)).toBeInTheDocument()
    })
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/pages/admin/__tests__/AdminPostEdit.test.jsx
```

Expected: FAIL (auto-save and preview not implemented yet).

- [ ] **Step 3: Update AdminPostEdit.jsx**

Replace the entire content of `src/pages/admin/AdminPostEdit.jsx` with:

```jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import RichTextEditor from '../../components/RichTextEditor'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function SaveStatus({ status }) {
  if (!status || status === 'idle') return null
  if (status === 'pending') return <span className="text-xs text-gray-400">• 未儲存變更</span>
  if (status === 'saving') return <span className="text-xs text-gray-400">儲存中…</span>
  if (status === 'error') return <span className="text-xs text-red-400">自動儲存失敗</span>
  if (status.startsWith('saved:')) return <span className="text-xs text-gray-400">已自動儲存 {status.slice(6)}</span>
  return null
}

export default function AdminPostEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', slug: '', content: '', excerpt: '',
    tags: '', published: false,
  })
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const autoSaveRef = useRef()

  useEffect(() => {
    if (!isNew) {
      supabase.from('posts').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({ ...data, tags: (data.tags ?? []).join(', ') })
      })
    }
  }, [id, isNew])

  // Auto-save: 30s debounce, existing posts only
  useEffect(() => {
    if (isNew) return
    setSaveStatus('pending')
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(async () => {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      setSaveStatus('saving')
      const { error } = await supabase.from('posts').update(payload).eq('id', id)
      if (error) {
        setSaveStatus('error')
      } else {
        const now = new Date()
        const hh = now.getHours().toString().padStart(2, '0')
        const mm = now.getMinutes().toString().padStart(2, '0')
        setSaveStatus(`saved:${hh}:${mm}`)
      }
    }, 30000)
    return () => clearTimeout(autoSaveRef.current)
  }, [form, id, isNew])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => {
      const updated = { ...f, [name]: type === 'checkbox' ? checked : value }
      if (name === 'title' && isNew) updated.slug = slugify(value)
      return updated
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      published_at: form.published ? (form.published_at || new Date().toISOString()) : null,
    }
    if (isNew) {
      await supabase.from('posts').insert(payload)
    } else {
      await supabase.from('posts').update(payload).eq('id', id)
    }
    navigate('/admin/posts')
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-lg font-bold">{isNew ? '新增文章' : '編輯文章'}</h1>
        <SaveStatus status={saveStatus} />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標題</label>
          <input aria-label="標題" name="title" value={form.title} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Slug（URL）</label>
          <input name="slug" value={form.slug} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">摘要</label>
          <input name="excerpt" value={form.excerpt} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標籤（逗號分隔，如：測試策略, CI/CD）</label>
          <input name="tags" value={form.tags} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容</label>
          <RichTextEditor
            value={form.content}
            onChange={html => setForm(f => ({ ...f, content: html }))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="published" checked={form.published} onChange={handleChange} />
          發布
        </label>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
          {!isNew && (
            <button type="button"
              onClick={() => window.open(`/blog/${form.slug}`, '_blank')}
              className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
              預覽
            </button>
          )}
          <button type="button" onClick={() => navigate('/admin/posts')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/pages/admin/__tests__/AdminPostEdit.test.jsx
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminPostEdit.jsx src/pages/admin/__tests__/AdminPostEdit.test.jsx
git commit -m "feat: add auto-save and preview button to AdminPostEdit"
```

---

## Task 3: Build + Deploy

- [ ] **Step 1: Build**

```bash
npm run build 2>&1 | tail -3
```

Expected: build completes without errors.

- [ ] **Step 2: Deploy**

```bash
npx wrangler pages deploy dist --project-name jimmy-hong-portfolio 2>&1 | grep -E "✨|https://"
```

Expected: deployment URL printed.

- [ ] **Step 3: Manual verify**

Open the deployment URL → `/admin/posts`:
- [ ] Search box filters posts by title in real time
- [ ] 草稿 / 已發布 pills filter correctly
- [ ] Tag dropdown populates and filters
- [ ] Checkbox selects a post → batch bar appears with 發布 / 取消發布 / 刪除 buttons
- [ ] 全選 checkbox selects all visible posts
- [ ] Batch 發布 updates status and clears selection

Open any existing post in edit:
- [ ] 預覽 button visible → click → public post opens in new tab
- [ ] Edit title → "• 未儲存變更" appears → wait 30 seconds → "已自動儲存 HH:MM" appears
