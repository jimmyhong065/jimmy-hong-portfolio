import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

const TABS = [
  {
    to: '/projects',
    label: '作品集',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/blog',
    label: '部落格',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <path d="M14 3v6h6"/><path d="M9 12h6M9 16h6"/>
      </svg>
    ),
  },
  {
    to: '/services',
    label: '合作方式',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    ),
  },
  {
    to: '/about',
    label: '關於我',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

export default function Nav() {
  const { settings } = useSettings()
  const location = useLocation()

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-12 py-5 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-wide">Jimmy Hong</Link>
          {/* Desktop nav — hidden on mobile */}
          <ul className="hidden md:flex gap-8 list-none">
            <li><Link to="/projects" className="text-sm text-gray-500 hover:text-gray-900">作品集</Link></li>
            <li><Link to="/blog" className="text-sm text-gray-500 hover:text-gray-900">部落格</Link></li>
            <li><Link to="/services" className="text-sm text-gray-500 hover:text-gray-900">合作方式</Link></li>
            <li><Link to="/about" className="text-sm text-gray-500 hover:text-gray-900">關於我</Link></li>
          </ul>
          {/* Desktop CTA — hidden on mobile */}
          <div className="hidden md:flex items-center gap-3">
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
      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-4 list-none m-0 p-0">
          {TABS.map(tab => {
            const active = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={`flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none ${active ? 'text-gray-900' : 'text-gray-400'}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
