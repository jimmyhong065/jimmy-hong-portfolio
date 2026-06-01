import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

export default function PhotoNav() {
  const { settings } = useSettings()
  const location = useLocation()
  const onPhoto = location.pathname.startsWith('/photo')

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-4 grid grid-cols-3 items-center">
          {/* Left — hidden on mobile */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/photo" className="text-sm text-gray-600 hover:text-gray-900">
              作品集
            </Link>
            <a
              href="https://www.instagram.com/r.bing_recording/"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Instagram
            </a>
          </div>

          {/* Center — always visible, full width on mobile */}
          <div className="flex justify-center col-span-3 md:col-span-1">
            <Link to="/photo" className="text-xl font-bold tracking-widest">
              r.bing recording
            </Link>
          </div>

          {/* Right — hidden on mobile */}
          <div className="hidden md:flex items-center justify-end gap-6">
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                聯絡我
              </a>
            )}
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">
              QA 網站
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className={`grid ${settings.email ? 'grid-cols-4' : 'grid-cols-3'} list-none m-0 p-0`}>
          {/* 作品集 */}
          <li>
            <Link
              to="/photo"
              aria-current={onPhoto ? 'page' : undefined}
              className={`flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none ${onPhoto ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>作品集</span>
            </Link>
          </li>
          {/* Instagram */}
          <li>
            <a
              href="https://www.instagram.com/r.bing_recording/"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none text-gray-400"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              <span>Instagram</span>
            </a>
          </li>
          {/* 聯絡我 */}
          {settings.email && (
            <li>
              <a
                href={`mailto:${settings.email}`}
                className="flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none text-gray-400"
              >
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span>聯絡我</span>
              </a>
            </li>
          )}
          {/* QA 網站 */}
          <li>
            <Link
              to="/"
              aria-current={location.pathname === '/' ? 'page' : undefined}
              className={`flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none ${location.pathname === '/' ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12L12 3L21 12"/><path d="M9 21V12H15V21"/><line x1="3" y1="21" x2="21" y2="21"/>
              </svg>
              <span>QA 網站</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  )
}
