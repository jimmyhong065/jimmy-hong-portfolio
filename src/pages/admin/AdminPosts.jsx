import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminPosts() {
  const [posts, setPosts] = useState([])

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('id, title, tags, published, published_at')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
  }

  useEffect(() => { fetchPosts() }, [])

  async function handleDelete(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('posts').delete().eq('id', id)
    fetchPosts()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-lg font-bold">文章管理</h1>
        <Link to="/admin/posts/new" className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          + 新增文章
        </Link>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標題</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標籤</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">狀態</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">日期</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-sm">{post.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
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
                    <Link to={`/admin/posts/${post.id}`} className="text-xs border border-gray-200 px-3 py-1 rounded hover:border-gray-400">編輯</Link>
                    <button onClick={() => handleDelete(post.id)} className="text-xs border border-red-100 text-red-500 px-3 py-1 rounded hover:border-red-300">刪除</button>
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
