import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import BlogRow from '../components/BlogRow'
import TagFilter from '../components/TagFilter'
import { usePosts } from '../hooks/usePosts'

const PAGE_SIZE = 12

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const { posts, loading } = usePosts()

  const selectedTag = searchParams.get('tag') || null

  function setSelectedTag(tag) {
    if (tag) setSearchParams({ tag })
    else setSearchParams({})
  }

  const allTags = useMemo(() => {
    const set = new Set(posts.flatMap(p => p.tags ?? []))
    return [...set]
  }, [posts])

  const filtered = useMemo(() => {
    let result = selectedTag ? posts.filter(p => p.tags?.includes(selectedTag)) : posts
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q)
      )
    }
    return result
  }, [posts, selectedTag, query])

  useEffect(() => { setPage(1) }, [selectedTag, query])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <SEOHead title="部落格" description="Jimmy Hong 關於 QA 流程、測試策略、自動化的技術文章。" canonical="/blog" />
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Blog</p>
        <h1 className="text-xl font-bold mb-8">文章</h1>
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋文章標題或摘要..."
            className="w-full text-sm border border-gray-200 rounded-full pl-10 pr-5 py-3 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
          />
        </div>
        <TagFilter tags={allTags} selected={selectedTag} onSelect={setSelectedTag} />
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-8">沒有符合的文章。</p>
        ) : (
          <>
            <div>{paged.map(p => <BlogRow key={p.id} post={p} />)}</div>
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} 篇，共 {filtered.length} 篇
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-30 hover:border-gray-400">←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce((acc, n, i, arr) => {
                      if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
                      acc.push(n)
                      return acc
                    }, [])
                    .map((n, i) => n === '…'
                      ? <span key={`e${i}`} className="text-xs px-2 py-1.5 text-gray-400">…</span>
                      : <button key={n} onClick={() => setPage(n)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${page === n ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}>
                          {n}
                        </button>
                    )}
                  <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-30 hover:border-gray-400">→</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
