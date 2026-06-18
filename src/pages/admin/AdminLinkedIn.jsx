import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const STORAGE_KEY = 'linkedin_posted_v2'

function getPosted() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}

function savePosted(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export default function AdminLinkedIn() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [posted, setPosted] = useState(() => getPosted())
  const [copied, setCopied] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      let { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, linkedin_draft, published')
        .order('published_at', { ascending: false })

      if (error) {
        // linkedin_draft 欄位尚未建立，fallback 不含該欄位
        ;({ data } = await supabase
          .from('posts')
          .select('id, title, slug, excerpt, published')
          .order('published_at', { ascending: false }))
      }

      setPosts(data ?? [])
      const drafts = {}
      for (const p of (data ?? [])) drafts[p.id] = p.linkedin_draft ?? ''
      setEditDraft(drafts)
      setLoading(false)
    }
    load()
  }, [])

  function togglePosted(id) {
    setPosted(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      savePosted(next)
      return next
    })
  }

  async function saveDraft(post) {
    setSaving(post.id)
    await supabase.from('posts').update({ linkedin_draft: editDraft[post.id] }).eq('id', post.id)
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, linkedin_draft: editDraft[post.id] } : p))
    setSaving(null)
  }

  function copyDraft(post) {
    const url = post.slug ? `https://qa-lens.com/blog/${post.slug}` : ''
    const draft = (editDraft[post.id] ?? '').replace('[連結]', url)
    navigator.clipboard.writeText(draft)
    setCopied(post.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const visible = useMemo(() => posts.filter(p => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'posted' ? posted.has(p.id) :
      filter === 'pending' ? !posted.has(p.id) :
      filter === 'no_draft' ? !p.linkedin_draft?.trim() : true
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  }), [posts, filter, search, posted])

  const postedCount = posts.filter(p => posted.has(p.id)).length
  const noDraftCount = posts.filter(p => !p.linkedin_draft?.trim()).length

  if (loading) return <div className="text-sm text-gray-400">載入中…</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg font-bold">LinkedIn 草稿</h1>
        <span className="text-xs text-gray-500">
          已發布 <strong className="text-green-600">{postedCount}</strong> /
          共 <strong>{posts.length}</strong> 篇
          {noDraftCount > 0 && <span className="text-amber-500 ml-1">（{noDraftCount} 篇無草稿）</span>}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all"
          style={{ width: posts.length ? `${(postedCount / posts.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="搜尋標題…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[160px] focus:outline-none focus:border-gray-400"
        />
        <div className="flex gap-1 flex-wrap">
          {[
            ['all', '全部'],
            ['pending', '待發布'],
            ['posted', '已發布'],
            ['no_draft', '無草稿'],
          ].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                filter === val ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:border-gray-400'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {visible.map(post => {
          const isPosted = posted.has(post.id)
          const isExpanded = expanded === post.id
          const hasDraft = !!post.linkedin_draft?.trim()
          const draftChanged = editDraft[post.id] !== (post.linkedin_draft ?? '')

          return (
            <div key={post.id}
              className={`border rounded-xl overflow-hidden transition-colors ${
                isPosted ? 'border-green-100 bg-green-50/30' :
                !hasDraft ? 'border-amber-100' : 'border-gray-200'
              }`}>
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex-1 text-sm font-medium cursor-pointer hover:text-blue-600 ${
                    isPosted ? 'text-gray-400 line-through' : 'text-gray-800'
                  }`}
                  onClick={() => setExpanded(isExpanded ? null : post.id)}
                >
                  {post.title}
                  {!hasDraft && <span className="ml-2 text-xs text-amber-400 font-normal">無草稿</span>}
                  {!post.published && <span className="ml-2 text-xs text-gray-300 font-normal">草稿</span>}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {hasDraft && (
                    <button
                      onClick={() => copyDraft(post)}
                      className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:border-gray-400 transition-colors"
                    >
                      {copied === post.id ? '✓ 已複製' : '複製'}
                    </button>
                  )}
                  <button
                    onClick={() => togglePosted(post.id)}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                      isPosted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'border border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {isPosted ? '已發布' : '標記已發'}
                  </button>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : post.id)}
                    className="text-gray-400 hover:text-gray-600 text-xs px-1"
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Expanded: two-panel */}
              {isExpanded && (
                <div className="border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                  {/* Left: 文章 */}
                  <div className="p-4 bg-gray-50/50">
                    <p className="text-xs font-medium text-gray-400 mb-3">📄 文章</p>
                    <p className="text-sm font-medium text-gray-800 mb-1">{post.title}</p>
                    {post.excerpt && (
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{post.excerpt}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {post.slug && (
                        <a
                          href={`https://qa-lens.com/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors"
                        >
                          開啟文章 ↗
                        </a>
                      )}
                      <Link
                        to={`/admin/posts/${post.id}`}
                        className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors"
                      >
                        編輯文章
                      </Link>
                    </div>
                    {post.slug && (
                      <p className="text-xs text-gray-300 mt-2 break-all">
                        qa-lens.com/blog/{post.slug}
                      </p>
                    )}
                  </div>

                  {/* Right: LinkedIn 草稿 */}
                  <div className="p-4 bg-white">
                    <p className="text-xs font-medium text-blue-600 mb-3">💼 LinkedIn 小短文</p>
                    <textarea
                      value={editDraft[post.id] ?? ''}
                      onChange={e => setEditDraft(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="在這裡貼上 LinkedIn 草稿（[連結] 複製時自動換成文章 URL）"
                      rows={10}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-300 resize-y leading-relaxed"
                    />
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <button
                        onClick={() => copyDraft(post)}
                        className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700"
                      >
                        {copied === post.id ? '✓ 已複製' : '複製全文'}
                      </button>
                      {draftChanged && (
                        <button
                          onClick={() => saveDraft(post)}
                          disabled={saving === post.id}
                          className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving === post.id ? '儲存中…' : '儲存草稿'}
                        </button>
                      )}
                      <a
                        href="https://www.linkedin.com/post/new/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs border border-gray-200 px-4 py-1.5 rounded-lg hover:border-gray-400"
                      >
                        開啟 LinkedIn ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {visible.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-400">
            沒有符合條件的文章
          </div>
        )}
      </div>
    </div>
  )
}
