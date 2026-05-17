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
