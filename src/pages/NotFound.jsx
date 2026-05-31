import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'

export default function NotFound() {
  return (
    <>
      <SEOHead title="找不到頁面" />
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-12 py-32 text-center">
        <p className="text-6xl font-bold text-gray-100 mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-900 mb-3">找不到這個頁面</h1>
        <p className="text-sm text-gray-500 mb-8">可能是連結失效，或頁面已移除。</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="text-sm bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700">
            回首頁
          </Link>
          <Link to="/blog" className="text-sm border border-gray-200 px-5 py-2.5 rounded-md hover:border-gray-400">
            看文章
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
