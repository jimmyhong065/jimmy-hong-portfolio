import { useState, useMemo } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import BlogRow from '../components/BlogRow'
import TagFilter from '../components/TagFilter'
import { usePosts } from '../hooks/usePosts'

export default function Blog() {
  const [selectedTag, setSelectedTag] = useState(null)
  const { posts, loading } = usePosts()

  const allTags = useMemo(() => {
    const set = new Set(posts.flatMap(p => p.tags ?? []))
    return [...set]
  }, [posts])

  const filtered = selectedTag
    ? posts.filter(p => p.tags?.includes(selectedTag))
    : posts

  return (
    <>
      <SEOHead title="部落格" description="Jimmy Hong 關於 QA 流程、測試策略、自動化的技術文章。" />
      <Nav />
      <main className="max-w-5xl mx-auto px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Blog</p>
        <h1 className="text-xl font-bold mb-8">文章</h1>
        <TagFilter tags={allTags} selected={selectedTag} onSelect={setSelectedTag} />
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : (
          <div>{filtered.map(p => <BlogRow key={p.id} post={p} />)}</div>
        )}
      </main>
      <Footer />
    </>
  )
}
