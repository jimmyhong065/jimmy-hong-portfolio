// src/pages/admin/AdminSubscribers.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { stripMarkdown } from '../../lib/text'

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

function PostSearchSelect({ posts, value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = posts.find(p => p.slug === value)

  const filtered = posts.filter(p =>
    !query || p.title.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(slug) {
    onChange(slug)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
  }

  return (
    <div ref={ref} className="relative max-w-sm">
      <div
        className={`flex items-center gap-2 border rounded-lg px-3 py-2 bg-white cursor-text ${
          open ? 'border-gray-400 ring-1 ring-gray-300' : 'border-gray-200'
        }`}
        onClick={() => setOpen(true)}
      >
        {selected && !open ? (
          <>
            <span className="text-sm text-gray-800 flex-1 truncate">{selected.title}</span>
            <button
              onClick={e => { e.stopPropagation(); handleClear() }}
              className="text-gray-400 hover:text-gray-600 shrink-0 text-xs"
            >✕</button>
          </>
        ) : (
          <input
            autoFocus={open}
            type="text"
            value={open ? query : ''}
            placeholder={selected ? selected.title : '搜尋文章標題…'}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
          />
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">找不到符合的文章</div>
          ) : (
            filtered.map(p => (
              <button
                key={p.slug}
                onMouseDown={() => handleSelect(p.slug)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  p.slug === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                {p.title}
              </button>
            ))
          )}
        </div>
      )}
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const token = session?.access_token ?? ''
      const [subsRes, postsRes] = await Promise.all([
        fetch('/api/admin/subscribers', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(r => r.json()),
        supabase.from('posts').select('slug, title, excerpt').eq('published', true).order('published_at', { ascending: false }),
      ])
      setSubscribers(Array.isArray(subsRes) ? subsRes : [])
      setPosts(postsRes.data ?? [])
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
      if (!session) { setResult('請重新登入後再試'); setSending(false); return }
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
        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            共 {confirmedCount} 位已確認訂閱者
          </p>
        )}
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
          <label className="text-xs text-gray-500 mb-1 block">
            選擇文章 <span className="text-gray-400">（共 {posts.length} 篇已發布）</span>
          </label>
          <PostSearchSelect
            posts={posts}
            value={selectedSlug}
            onChange={slug => { setSelectedSlug(slug); setResult(null) }}
          />
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
