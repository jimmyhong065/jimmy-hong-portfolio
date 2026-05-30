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
        <div className="flex items-center gap-3">
          <a href="/rss.xml" target="_blank" rel="noreferrer" title="RSS 訂閱"
            className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
            </svg>
          </a>
          {settings.email && (
            <a href={`mailto:${settings.email}`} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
              聯絡我
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
