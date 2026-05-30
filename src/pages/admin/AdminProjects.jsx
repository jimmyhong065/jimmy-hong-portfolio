import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sortKey, setSortKey] = useState('display_order')
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortIcon = (col) => sortKey === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('id, title, tags, display_order')
    setProjects(data ?? [])
  }

  useEffect(() => { fetchProjects() }, [])

  const allTags = useMemo(() => {
    const tags = new Set()
    projects.forEach(p => (p.tags ?? []).forEach(t => tags.add(t)))
    return [...tags].sort()
  }, [projects])

  const visibleProjects = useMemo(() => {
    const filtered = projects.filter(p => {
      const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase())
      const matchTag = !tagFilter || (p.tags ?? []).includes(tagFilter)
      return matchSearch && matchTag
    })
    return [...filtered].sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [projects, search, tagFilter, sortKey, sortDir])

  async function handleDelete(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('projects').delete().eq('id', id)
    fetchProjects()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg font-bold">作品集管理</h1>
        <Link to="/admin/projects/new" className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          + 新增作品
        </Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input type="text" placeholder="🔍 搜尋標題…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 flex-1 min-w-[160px]" />
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400">
          <option value="">全部標籤</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('title')}>標題{sortIcon('title')}</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標籤</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('display_order')}>排序{sortIcon('display_order')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visibleProjects.map(p => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-sm">{p.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {(p.tags ?? []).map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{p.display_order}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/admin/projects/${p.id}`} className="text-xs border border-gray-200 px-3 py-1 rounded hover:border-gray-400">編輯</Link>
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
