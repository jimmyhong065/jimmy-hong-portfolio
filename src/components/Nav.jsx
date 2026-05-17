import { Link } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

export default function Nav() {
  const { settings } = useSettings()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-12 py-5 flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold tracking-wide">Jimmy Hong</Link>
        <ul className="flex gap-8 list-none">
          <li><Link to="/projects" className="text-sm text-gray-500 hover:text-gray-900">作品集</Link></li>
          <li><Link to="/blog" className="text-sm text-gray-500 hover:text-gray-900">部落格</Link></li>
          <li><Link to="/about" className="text-sm text-gray-500 hover:text-gray-900">關於我</Link></li>
        </ul>
        {settings.email && (
          <a href={`mailto:${settings.email}`} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
            聯絡我
          </a>
        )}
      </div>
    </nav>
  )
}
