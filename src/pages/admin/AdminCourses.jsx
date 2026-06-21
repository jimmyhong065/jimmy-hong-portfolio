import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminCourses() {
  const [courses, setCourses] = useState([])

  async function fetchCourses() {
    // 課程 + 章節數（章節 = posts.course_id）
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug, cover_url, published, display_order, posts(count)')
    const rows = (data ?? []).map(c => ({
      ...c,
      chapter_count: c.chapter_count ?? c.posts?.[0]?.count ?? 0,
    }))
    rows.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    setCourses(rows)
  }
  useEffect(() => { fetchCourses() }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg font-bold">課程管理</h1>
        <Link to="/admin/courses/new" className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          + 新增課程
        </Link>
      </div>
      <div className="grid gap-3">
        {courses.map(c => (
          <Link key={c.id} to={`/admin/courses/${c.id}`}
            className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
            <div className="w-20 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.title}</div>
              <div className="text-xs text-gray-500">{c.chapter_count} 章 · 順序 {c.display_order}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${c.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {c.published ? '已公開' : '未公開'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
