import { Link } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

export default function PhotoNav() {
  const { settings } = useSettings()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-8 py-4 grid grid-cols-3 items-center">
        {/* Left */}
        <div className="flex items-center gap-6">
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

        {/* Center */}
        <div className="flex justify-center">
          <Link to="/photo" className="text-xl font-bold tracking-widest">
            r.bing recording
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-6">
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
  )
}
