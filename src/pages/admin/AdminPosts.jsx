import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function readingTime(content) {
  if (!content) return 1
  return Math.max(1, Math.ceil(content.replace(/\s/g, '').length / 400))
}

export default function AdminPosts() {
  const [posts, setPosts] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [sortKey, setSortKey] = useState('published_at')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [batchTagInput, setBatchTagInput] = useState('')
  const PAGE_SIZE = 15

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortIcon = (col) => sortKey === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('id, title, tags, published, published_at, content')
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

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter(p => {
      const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' ? true
        : statusFilter === 'published' ? p.published : !p.published
      const matchTag = !tagFilter || (p.tags ?? []).includes(tagFilter)
      return matchSearch && matchStatus && matchTag
    })
    return [...filtered].sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
      if (typeof av === 'boolean') { av = av ? 1 : 0; bv = bv ? 1 : 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [posts, search, statusFilter, tagFilter, sortKey, sortDir])

  const totalPages = Math.ceil(visiblePosts.length / PAGE_SIZE)
  const pagedPosts = visiblePosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, statusFilter, tagFilter, sortKey, sortDir])

  const allVisibleSelected = pagedPosts.length > 0 && pagedPosts.every(p => selectedIds.has(p.id))

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        pagedPosts.forEach(p => next.delete(p.id))
        return next
      })
    } else {
      setSelectedIds(prev => new Set([...prev, ...pagedPosts.map(p => p.id)]))
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

  async function handleDelete(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('posts').delete().eq('id', id)
    fetchPosts()
  }

  async function handleTogglePublish(post) {
    const published = !post.published
    await supabase.from('posts').update({
      published,
      published_at: published ? (post.published_at || new Date().toISOString()) : null,
    }).eq('id', post.id)
    fetchPosts()
  }

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
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('title')}>標題{sortIcon('title')}</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">時間</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標籤</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('published')}>狀態{sortIcon('published')}</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('published_at')}>日期{sortIcon('published_at')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pagedPosts.map(post => (
              <tr key={post.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.has(post.id)}
                    onChange={() => toggleSelect(post.id)} />
                </td>
                <td className="px-4 py-3 text-sm">{post.title}</td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {readingTime(post.content)} 分鐘
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {(post.tags ?? []).map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleTogglePublish(post)}
                    title="點擊切換發布狀態"
                    className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-opacity hover:opacity-70 ${
                      post.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {post.published ? '已發布' : '草稿'}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleClone(post)}
                      className="text-xs border border-gray-200 px-3 py-1 rounded hover:border-gray-400">複製</button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visiblePosts.length)} 篇，共 {visiblePosts.length} 篇
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-30 hover:border-gray-400">
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, i, arr) => {
                if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) => n === '…'
                ? <span key={`ellipsis-${i}`} className="text-xs px-2 py-1.5 text-gray-400">…</span>
                : <button key={n} onClick={() => setPage(n)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      page === n ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}>
                    {n}
                  </button>
              )}
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-30 hover:border-gray-400">
              →
            </button>
          </div>
        </div>
      )}

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
        </div>
      )}
    </div>
  )
}
