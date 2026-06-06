import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { usePushSubscription } from '../hooks/usePushSubscription'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationBadge } from './NotificationBadge'
import { SVG_MAP, FALLBACK_TABS } from './NavIconMap'

const DESKTOP_LINKS = [
  { key: 'projects', to: '/projects', label: '作品集' },
  { key: 'blog', to: '/blog', label: '部落格' },
  { key: 'saved', to: '/saved', label: '收藏' },
  { key: 'faq', to: '/faq', label: 'FAQ' },
  { key: 'about', to: '/about', label: '關於我' },
]

export default function Nav() {
  const { settings } = useSiteSettings()
  const hidden = settings.hidden_pages ?? []
  const rawTabs = settings?.nav_tabs?.length ? settings.nav_tabs : FALLBACK_TABS
  const tabs = rawTabs.filter(t => t.visible).sort((a, b) => a.order - b.order)
  const visibleDesktopLinks = DESKTOP_LINKS.filter(l => !hidden.includes(l.key))
  const location = useLocation()
  const { state, error, subscribe, unsubscribe } = usePushSubscription()
  const [hint, setHint] = useState(null)
  const { unreadCount } = useNotifications()

  function showHint(msg) {
    setHint(msg)
    setTimeout(() => setHint(null), 3000)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-12 py-5 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-wide">QA Lab</Link>
          {/* Mobile bell */}
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
          {/* Desktop nav */}
          <ul className="hidden md:flex gap-8 list-none">
            {visibleDesktopLinks.map(link => (
              <li key={link.key}>
                <Link to={link.to} className="text-sm text-gray-500 hover:text-gray-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Desktop CTA */}
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
              <a
                href={`mailto:${settings.email}`}
                className="text-xs px-4 py-2 rounded-md transition-colors"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
              >
                聯絡我
              </a>
            )}
          </div>
        </div>
      </nav>
      {/* Mobile bottom tab bar */}
      <nav
        className="fixed left-4 right-4 md:hidden z-50 flex items-center justify-around rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-white/10"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {tabs.map(tab => {
          const active = location.pathname === tab.url || location.pathname.startsWith(tab.url + '/')
          const icon = SVG_MAP[tab.icon_key] ?? SVG_MAP.link
          const isExternal = tab.url.startsWith('http')
          const inner = (
            <span
              aria-label={tab.label}
              className={`relative flex items-center justify-center rounded-xl py-3 px-4 transition-colors ${
                active ? 'text-white bg-white/15' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {icon}
              <NotificationBadge count={tab.url === '/notifications' ? unreadCount : 0} />
            </span>
          )
          return isExternal ? (
            <a key={tab.id} href={tab.url} target="_blank" rel="noreferrer" aria-label={tab.label}>
              {inner}
            </a>
          ) : (
            <Link key={tab.id} to={tab.url} aria-current={active ? 'page' : undefined}>
              {inner}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
