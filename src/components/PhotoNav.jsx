import { Link } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

export default function PhotoNav() {
  const { settings } = useSettings()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-12 py-5 flex items-center justify-between">
        <Link to="/photo" className="text-sm font-semibold tracking-wide">r.bing recording</Link>
        <div className="flex items-center gap-6">
          <a
            href="https://www.instagram.com/r.bing_recording/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Instagram
          </a>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">QA 網站</Link>
          {settings.email && (
            <a
              href={`mailto:${settings.email}`}
              className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              聯絡我
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
