import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import { usePushSubscription } from '../hooks/usePushSubscription'

const TABS = [
  {
    to: '/projects',
    label: '作品集',
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/blog',
    label: '部落格',
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <path d="M14 3v6h6"/><path d="M9 12h6M9 16h6"/>
      </svg>
    ),
  },
  {
    to: '/saved',
    label: '收藏',
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
    ),
  },
  {
    to: '/faq',
    label: 'FAQ',
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    to: '/about',
    label: '關於我',
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

export default function Nav() {
  const { settings } = useSettings()
  const location = useLocation()
  const { state, error, subscribe, unsubscribe } = usePushSubscription()
  const [hint, setHint] = useState(null)

  function showHint(msg) {
    setHint(msg)
    setTimeout(() => setHint(null), 3000)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-12 py-5 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-wide">Jimmy Hong</Link>
          {/* Mobile bell — hidden on desktop */}
          {(state === 'unsubscribed' || state === 'subscribed' || state === 'denied' || state === 'unsupported') && (
            <div className="relative md:hidden">
              <button
                onClick={
                  state === 'subscribed' ? unsubscribe
                  : state === 'denied' ? () => showHint('請至瀏覽器設定開啟通知權限')
                  : state === 'unsupported' ? () => showHint('需將網站加入主畫面才能訂閱通知')
                  : subscribe
                }
                title={
                  state === 'subscribed' ? '取消通知訂閱'
                  : state === 'denied' ? '請至瀏覽器設定開啟通知權限'
                  : state === 'unsupported' ? '需將網站加入主畫面才能訂閱通知'
                  : '訂閱新文章通知'
                }
                className={`transition-colors p-1 ${(state === 'denied' || state === 'unsupported') ? 'text-gray-300 cursor-default' : 'text-gray-400 hover:text-gray-700'}`}
              >
                {state === 'subscribed' ? (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                ) : state === 'denied' ? (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    <line x1="4" y1="4" x2="20" y2="20"/>
                  </svg>
                ) : (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                )}
              </button>
              {(error || hint) && (
                <div className="absolute left-0 top-8 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {error || hint}
                </div>
              )}
            </div>
          )}
          {/* Desktop nav — hidden on mobile */}
          <ul className="hidden md:flex gap-8 list-none">
            <li><Link to="/projects" className="text-sm text-gray-500 hover:text-gray-900">作品集</Link></li>
            <li><Link to="/blog" className="text-sm text-gray-500 hover:text-gray-900">部落格</Link></li>
            <li><Link to="/saved" className="text-sm text-gray-500 hover:text-gray-900">收藏</Link></li>
            <li><Link to="/faq" className="text-sm text-gray-500 hover:text-gray-900">FAQ</Link></li>
            <li><Link to="/about" className="text-sm text-gray-500 hover:text-gray-900">關於我</Link></li>
          </ul>
          {/* Desktop CTA — hidden on mobile */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/rss.xml" target="_blank" rel="noreferrer" title="RSS 訂閱"
              className="text-gray-400 hover:text-gray-700 transition-colors">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
              </svg>
            </a>
            {(state === 'unsubscribed' || state === 'subscribed' || state === 'denied' || state === 'unsupported') && (
              <div className="relative">
                <button
                  onClick={
                    state === 'subscribed' ? unsubscribe
                    : state === 'denied' ? () => showHint('請至瀏覽器設定開啟通知權限')
                    : state === 'unsupported' ? () => showHint('需將網站加入主畫面才能訂閱通知')
                    : subscribe
                  }
                  title={
                    state === 'subscribed' ? '取消通知訂閱'
                    : state === 'denied' ? '請至瀏覽器設定開啟通知權限'
                    : state === 'unsupported' ? '需將網站加入主畫面才能訂閱通知'
                    : '訂閱新文章通知'
                  }
                  className={`transition-colors ${(state === 'denied' || state === 'unsupported') ? 'text-gray-300 cursor-default' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  {state === 'subscribed' ? (
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                  ) : state === 'denied' ? (
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      <line x1="4" y1="4" x2="20" y2="20"/>
                    </svg>
                  ) : (
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  )}
                </button>
                {(error || hint) && (
                  <div className="absolute right-0 top-7 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {error || hint}
                  </div>
                )}
              </div>
            )}
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
        <ul className="grid grid-cols-5 list-none m-0 p-0">
          {TABS.map(tab => {
            const active = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  aria-current={active ? 'page' : undefined}
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
