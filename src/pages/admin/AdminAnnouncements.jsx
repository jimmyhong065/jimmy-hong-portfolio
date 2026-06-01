import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(a => a.filter(x => x.id !== id))
  }

  async function handleToggle(item) {
    await supabase.from('announcements').update({ active: !item.active }).eq('id', item.id)
    setAnnouncements(a => a.map(x => x.id === item.id ? { ...x, active: !x.active } : x))
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-lg font-bold">最新消息管理</h1>
        <Link to="/admin/announcements/new"
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
          + 新增
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-gray-300">尚無公告</p>
      ) : (
        <div className="flex flex-col gap-2">
          {announcements.map(a => (
            <div key={a.id} className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className={`mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${a.active ? 'bg-green-400' : 'bg-gray-300'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  {a.content && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.content}</p>}
                </div>
              </div>
              <div className="flex gap-3 ml-4 flex-shrink-0">
                <button onClick={() => handleToggle(a)}
                  className="text-xs text-gray-400 hover:text-gray-700">
                  {a.active ? '下架' : '上架'}
                </button>
                <Link to={`/admin/announcements/${a.id}`} className="text-xs text-gray-500 hover:text-gray-900">編輯</Link>
                <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:text-red-600">刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
