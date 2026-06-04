# Email 訂閱管理後台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在後台新增「訂閱管理」頁面，提供訂閱者唯讀清單 + 廣播文章通知功能。

**Architecture:** 新建 CF Function `/api/admin/email-broadcast` 處理廣播發送（Supabase JWT 認證），新建 `AdminSubscribers.jsx` 頁面提供清單與發送 UI，最後串接 App.jsx 路由和 AdminLayout sidebar。

**Tech Stack:** React, Supabase JS Client, Cloudflare Pages Functions, Brevo SMTP API, Vitest + Testing Library

---

## File Map

| 動作 | 路徑 | 說明 |
|------|------|------|
| 新建 | `functions/api/admin/email-broadcast.js` | 廣播 API，JWT 認證 + Brevo 發信 |
| 新建 | `src/pages/admin/AdminSubscribers.jsx` | 訂閱管理頁面 |
| 新建 | `src/pages/admin/__tests__/AdminSubscribers.test.jsx` | 元件測試 |
| 修改 | `src/App.jsx` | 新增 `/admin/subscribers` 路由 |
| 修改 | `src/pages/admin/AdminLayout.jsx` | Sidebar 新增「訂閱管理」連結 |

---

## Task 1: CF Function — email-broadcast.js

**Files:**
- Create: `functions/api/admin/email-broadcast.js`

此 function 與 `functions/api/email-send.js` 邏輯相似，但改用 Supabase JWT（而非 PUSH_SECRET）驗證 admin 身份。

- [ ] **Step 1: 建立 functions/api/admin/ 目錄並新增 email-broadcast.js**

```js
// functions/api/admin/email-broadcast.js
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function stripMarkdown(text) {
  return (text ?? '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/[*_~`#>]/g, '')
    .replace(/^\s*[-*+\d.]+\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!token) return json({ error: 'Unauthorized' }, 401)

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!userRes.ok) return json({ error: 'Unauthorized' }, 401)
  const user = await userRes.json()
  if (user.email !== env.ADMIN_EMAIL) return json({ error: 'Unauthorized' }, 401)

  const { title, excerpt, slug } = await request.json()
  if (!title || !slug) return json({ error: 'Missing title or slug' }, 400)

  const sbHeaders = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  }

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/email_subscribers?confirmed=eq.true&select=email,token`,
    { headers: sbHeaders }
  )
  const subscribers = await res.json()
  if (!Array.isArray(subscribers) || subscribers.length === 0) return json({ sent: 0 })

  const articleUrl = `${env.SITE_URL}/blog/${slug}`
  const cleanExcerpt = stripMarkdown(excerpt)

  let sent = 0
  await Promise.allSettled(subscribers.map(async ({ email, token: subToken }) => {
    const unsubUrl = `${env.SITE_URL}/api/email-unsubscribe?token=${subToken}`
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Jimmy Hong', email: env.BREVO_FROM },
        to: [{ email }],
        subject: title,
        htmlContent: `
          <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;color:#222;">
            <p style="font-size:11px;color:#aaa;margin:0 0 24px;text-transform:uppercase;letter-spacing:.08em;">Jimmy Hong — 新文章</p>
            <h1 style="font-size:20px;font-weight:700;line-height:1.3;margin:0 0 12px;">${title}</h1>
            ${cleanExcerpt ? `<p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">${cleanExcerpt}</p>` : ''}
            <a href="${articleUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">閱讀文章</a>
            <hr style="margin:32px 0;border:none;border-top:1px solid #eee;">
            <p style="font-size:11px;color:#bbb;margin:0;">
              您收到此信是因為訂閱了 Jimmy Hong 部落格。
              <a href="${unsubUrl}" style="color:#bbb;">取消訂閱</a>
            </p>
          </div>`,
      }),
    })
    if (r.ok) sent++
  }))

  return json({ sent })
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/admin/email-broadcast.js
git commit -m "feat(api): add admin email-broadcast CF function with JWT auth"
```

---

## Task 2: AdminSubscribers.jsx（TDD）

**Files:**
- Create: `src/pages/admin/AdminSubscribers.jsx`
- Create: `src/pages/admin/__tests__/AdminSubscribers.test.jsx`

- [ ] **Step 3: 寫測試（先讓它 FAIL）**

```jsx
// src/pages/admin/__tests__/AdminSubscribers.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminSubscribers from '../AdminSubscribers'

const SUBSCRIBERS = [
  { email: 'alice@example.com', confirmed: true, created_at: '2026-05-01T00:00:00Z' },
  { email: 'bob@example.com', confirmed: false, created_at: '2026-06-01T00:00:00Z' },
]
const POSTS = [
  { slug: 'leader-collab', title: 'Leader 說要改善流程', excerpt: 'QA 與 Leader 協作' },
]

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'email_subscribers') {
        return { select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: SUBSCRIBERS }) }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: POSTS }),
      }
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } }),
    },
  },
}))

function renderPage() {
  return render(<MemoryRouter><AdminSubscribers /></MemoryRouter>)
}

describe('AdminSubscribers', () => {
  it('shows confirmed subscriber count', async () => {
    renderPage()
    await screen.findByText('alice@example.com')
    expect(screen.getByText(/1.*已確認訂閱者/)).toBeInTheDocument()
  })

  it('shows confirmed and pending status badges', async () => {
    renderPage()
    await screen.findByText('alice@example.com')
    expect(screen.getByText('✅ 已確認')).toBeInTheDocument()
    expect(screen.getByText('⏳ 待確認')).toBeInTheDocument()
  })

  it('send button disabled when no article selected', async () => {
    renderPage()
    await screen.findByText('alice@example.com')
    expect(screen.getByRole('button', { name: '發送通知' })).toBeDisabled()
  })

  it('shows email preview when article selected', async () => {
    renderPage()
    await screen.findByText('alice@example.com')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'leader-collab' } })
    expect(screen.getAllByText('Leader 說要改善流程').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 4: 跑測試確認 FAIL**

```bash
npx vitest run src/pages/admin/__tests__/AdminSubscribers.test.jsx
```

Expected: FAIL — `Cannot find module '../AdminSubscribers'`

- [ ] **Step 5: 實作 AdminSubscribers.jsx**

```jsx
// src/pages/admin/AdminSubscribers.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function stripMarkdown(text) {
  return (text ?? '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/[*_~`#>]/g, '')
    .replace(/^\s*[-*+\d.]+\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function EmailPreview({ title, excerpt }) {
  const clean = stripMarkdown(excerpt)
  return (
    <div className="border rounded-lg p-6 bg-white max-w-sm text-sm mt-2" style={{ fontFamily: '-apple-system, sans-serif' }}>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Jimmy Hong — 新文章
      </p>
      <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>{title}</h1>
      {clean && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 18 }}>{clean}</p>}
      <div style={{ display: 'inline-block', background: '#111', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13 }}>
        閱讀文章
      </div>
      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <p style={{ fontSize: 11, color: '#bbb' }}>
        您收到此信是因為訂閱了 Jimmy Hong 部落格。取消訂閱
      </p>
    </div>
  )
}

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [posts, setPosts] = useState([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('email_subscribers').select('email, confirmed, created_at').order('created_at', { ascending: false }),
      supabase.from('posts').select('slug, title, excerpt').eq('published', true).order('published_at', { ascending: false }),
    ]).then(([{ data: subs }, { data: p }]) => {
      setSubscribers(subs ?? [])
      setPosts(p ?? [])
      setLoading(false)
    })
  }, [])

  const confirmedCount = subscribers.filter(s => s.confirmed).length
  const selectedPost = posts.find(p => p.slug === selectedSlug)

  async function sendBroadcast() {
    if (!selectedPost) return
    if (!window.confirm(`確定發送給 ${confirmedCount} 位訂閱者？`)) return
    setSending(true)
    setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/email-broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: selectedPost.title, excerpt: selectedPost.excerpt ?? '', slug: selectedPost.slug }),
      })
      const data = await res.json()
      setResult(res.ok ? `已發送給 ${data.sent} 位訂閱者` : `發送失敗：${data.error}`)
    } catch {
      setResult('發送失敗，請稍後再試')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-bold mb-7">訂閱管理</h1>

      <div className="mb-10">
        <p className="text-sm text-gray-500 mb-4">
          共 <span className="font-semibold text-gray-900">{confirmedCount}</span> 位已確認訂閱者
        </p>
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : subscribers.length === 0 ? (
          <p className="text-sm text-gray-400">尚無訂閱者</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">狀態</th>
                <th className="pb-2 font-medium">訂閱時間</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(s => (
                <tr key={s.email} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-700">{s.email}</td>
                  <td className="py-2 pr-4">
                    {s.confirmed
                      ? <span className="text-green-600">✅ 已確認</span>
                      : <span className="text-gray-400">⏳ 待確認</span>}
                  </td>
                  <td className="py-2 text-gray-400">
                    {new Date(s.created_at).toLocaleDateString('zh-TW')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-sm font-semibold mb-4">發送文章通知</h2>
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">選擇文章</label>
          <select
            value={selectedSlug}
            onChange={e => { setSelectedSlug(e.target.value); setResult(null) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm"
          >
            <option value="">— 請選擇 —</option>
            {posts.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
        </div>

        {selectedPost && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Email 預覽</p>
            <EmailPreview title={selectedPost.title} excerpt={selectedPost.excerpt ?? ''} />
          </div>
        )}

        <p className="text-xs text-gray-500 mb-3">
          將發送給 <span className="font-semibold text-gray-900">{confirmedCount}</span> 位已確認訂閱者
        </p>
        <button
          onClick={sendBroadcast}
          disabled={!selectedSlug || sending || confirmedCount === 0}
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40"
        >
          {sending ? '發送中…' : '發送通知'}
        </button>
        {result && <p className="text-sm mt-3 text-gray-600">{result}</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: 跑測試確認 PASS**

```bash
npx vitest run src/pages/admin/__tests__/AdminSubscribers.test.jsx
```

Expected: 4 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/AdminSubscribers.jsx src/pages/admin/__tests__/AdminSubscribers.test.jsx
git commit -m "feat(admin): add AdminSubscribers page with subscriber list and broadcast UI"
```

---

## Task 3: 串接路由與 Sidebar

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/admin/AdminLayout.jsx`

- [ ] **Step 8: 在 App.jsx 新增 import 和路由**

在 `src/App.jsx` 的 import 區塊（`AdminSubmissions` 那行後面）加：

```jsx
import AdminSubscribers from './pages/admin/AdminSubscribers'
```

在 `<Route path="submissions" element={<AdminSubmissions />} />` 後面加：

```jsx
<Route path="subscribers" element={<AdminSubscribers />} />
```

- [ ] **Step 9: 在 AdminLayout.jsx sidebar 新增連結**

在 `📬 提問收件匣` NavLink 後面加：

```jsx
<NavLink
  to="/admin/subscribers"
  className={({ isActive }) =>
    `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
  }
>
  📧 訂閱管理
</NavLink>
```

- [ ] **Step 10: 跑全套測試確認無 regression**

```bash
npx vitest run
```

Expected: All tests PASS

- [ ] **Step 11: Commit**

```bash
git add src/App.jsx src/pages/admin/AdminLayout.jsx
git commit -m "feat(admin): wire /admin/subscribers route and sidebar link"
```
