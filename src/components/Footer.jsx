import { Link } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'

const FOOTER_LINKS = [
  { key: 'blog',     to: '/blog',     label: '部落格' },
  { key: 'photo',    to: '/photo',    label: '攝影' },
  { key: 'services', to: '/services', label: '合作方式' },
  { key: 'about',    to: '/about',    label: '關於我' },
]

export default function Footer() {
  const { settings } = useSiteSettings()
  const hidden = settings.hidden_pages ?? []
  const brandName = settings.brand_name ?? 'QA Lab'
  const visibleLinks = FOOTER_LINKS.filter(l => !hidden.includes(l.key))
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-100 pt-8 pb-24 md:pb-10 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Desktop: two-column */}
        <div className="hidden md:flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">{brandName}</p>
            <div className="flex gap-4">
              {visibleLinks.map(l => (
                <Link key={l.key} to={l.to} className="text-xs text-gray-400 hover:text-gray-700">{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">© {year} {brandName}</p>
            <a href="/rss.xml" className="text-xs text-gray-300 hover:text-gray-500 mt-0.5 block">RSS 訂閱</a>
          </div>
        </div>
        {/* Mobile: stacked */}
        <div className="md:hidden flex flex-col gap-4">
          <p className="text-xs font-medium text-gray-700">{brandName}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {visibleLinks.map(l => (
              <Link key={l.key} to={l.to} className="text-xs text-gray-400 hover:text-gray-700">{l.label}</Link>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">© {year} {brandName}</p>
            <a href="/rss.xml" className="text-xs text-gray-300 hover:text-gray-500">RSS 訂閱</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
