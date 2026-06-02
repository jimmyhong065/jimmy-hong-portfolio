import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../hooks/useAuth'

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      <Helmet><title>後台管理 | Jimmy Hong</title></Helmet>
      <aside className="w-52 border-r border-gray-200 bg-gray-50 p-5 flex flex-col">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Admin</p>
        <nav className="flex flex-col gap-1 flex-1">
          <NavLink
            to="/admin/posts"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            📝 文章管理
          </NavLink>
          <NavLink
            to="/admin/projects"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            🗂 作品集管理
          </NavLink>
          <NavLink
            to="/admin/photo-projects"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            📷 攝影作品
          </NavLink>
          <NavLink
            to="/admin/photos"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            🖼 相簿管理
          </NavLink>
          <NavLink
            to="/admin/announcements"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            📢 最新消息
          </NavLink>
          <NavLink
            to="/admin/services"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            🤝 合作方式
          </NavLink>
          <NavLink
            to="/admin/faqs"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            ❓ FAQ 管理
          </NavLink>
          <NavLink
            to="/admin/submissions"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            📬 提問收件匣
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            ⚙️ 個人設定
          </NavLink>
        </nav>
        <button onClick={handleSignOut} className="text-sm text-red-400 px-3 py-2 rounded-md hover:bg-red-50 text-left">
          🔓 登出
        </button>
      </aside>
      <main className="flex-1 p-10 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
