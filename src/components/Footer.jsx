import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 pt-10 pb-24 md:py-10 px-4 md:px-12">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Jimmy Hong</p>
          <div className="flex gap-4">
            <Link to="/blog" className="text-xs text-gray-400 hover:text-gray-700">部落格</Link>
            <Link to="/photo" className="text-xs text-gray-400 hover:text-gray-700">攝影</Link>
            <Link to="/services" className="text-xs text-gray-400 hover:text-gray-700">合作方式</Link>
            <Link to="/about" className="text-xs text-gray-400 hover:text-gray-700">關於我</Link>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Jimmy Hong</p>
          <a href="/rss.xml" className="text-xs text-gray-300 hover:text-gray-500 mt-0.5 block">RSS 訂閱</a>
        </div>
      </div>
    </footer>
  )
}
