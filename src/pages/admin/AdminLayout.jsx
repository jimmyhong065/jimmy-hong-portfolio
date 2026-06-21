import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [wishPending, setWishPending] = useState(0)

  useEffect(() => {
    supabase
      .from('faq_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unread')
      .then(({ count }) => setUnreadCount(count ?? 0))
    supabase
      .from('article_wishes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setWishPending(count ?? 0))
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function navClass({ isActive }) {
    return `text-sm px-3 py-2 rounded-md flex items-center gap-1.5 ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
  }

  function sectionLabel(text) {
    return <p className="text-xs text-gray-300 px-3 pt-3 pb-0.5 uppercase tracking-wider first:pt-0">{text}</p>
  }

  return (
    <div className="min-h-screen flex">
      <Helmet><title>後台管理 | Jimmy Hong</title></Helmet>
      <aside className="w-52 border-r border-gray-200 bg-gray-50 p-5 flex flex-col">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Admin</p>
        <nav className="flex flex-col gap-0.5 flex-1">

          {sectionLabel('內容')}
          <NavLink to="/admin/posts" className={navClass}>📝 文章管理</NavLink>
          <NavLink to="/admin/courses" className={navClass}>🎓 課程管理</NavLink>
          <NavLink to="/admin/tags" className={navClass}>🏷 標籤總覽</NavLink>
          <NavLink to="/admin/announcements" className={navClass}>📢 最新消息</NavLink>
          <NavLink to="/admin/services" className={navClass}>🤝 合作方式</NavLink>
          <NavLink to="/admin/faqs" className={navClass}>❓ FAQ 管理</NavLink>

          {sectionLabel('作品')}
          <NavLink to="/admin/projects" className={navClass}>🗂 作品集管理</NavLink>
          <NavLink to="/admin/photo-projects" className={navClass}>📷 攝影作品</NavLink>
          <NavLink to="/admin/photos" className={navClass}>🖼 相簿管理</NavLink>

          {sectionLabel('溝通')}
          <NavLink to="/admin/submissions" className={({ isActive }) =>
            `text-sm px-3 py-2 rounded-md flex items-center ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
          }>
            <span className="flex-1 flex items-center gap-1.5">📬 提問收件匣</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-red-500 text-white rounded-full px-1.5 leading-5 tabular-nums">
                {unreadCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/admin/wishes" className={({ isActive }) =>
            `text-sm px-3 py-2 rounded-md flex items-center ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
          }>
            <span className="flex-1 flex items-center gap-1.5">🪙 許願池</span>
            {wishPending > 0 && (
              <span className="text-xs bg-amber-500 text-white rounded-full px-1.5 leading-5 tabular-nums">
                {wishPending}
              </span>
            )}
          </NavLink>
          <NavLink to="/admin/subscribers" className={navClass}>📧 訂閱管理</NavLink>
          <NavLink to="/admin/linkedin" className={navClass}>💼 LinkedIn 草稿</NavLink>

        </nav>

        <div className="border-t border-gray-200 pt-3 mt-2 flex flex-col gap-0.5">
          <NavLink to="/admin/settings" className={navClass}>⚙️ 個人設定</NavLink>
          <button onClick={handleSignOut}
            className="text-sm text-red-400 px-3 py-2 rounded-md hover:bg-red-50 text-left w-full flex items-center gap-1.5">
            🔓 登出
          </button>
        </div>
      </aside>
      <main className="flex-1 p-10 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
