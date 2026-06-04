// src/pages/Saved.jsx
import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import BlogCard from '../components/BlogCard'
import { useBookmarks } from '../hooks/useBookmarks'
import { useReadHistory } from '../hooks/useReadHistory'
import { supabase } from '../lib/supabase'

export default function Saved() {
  const { bookmarks } = useBookmarks()
  const { isRead } = useReadHistory()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookmarks.length === 0) {
      setPosts([])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('posts')
      .select('*')
      .in('slug', bookmarks)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? [])
        setLoading(false)
      })
  }, [bookmarks])

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-12 py-16 pb-28 lg:pb-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Saved</p>
        <h1 className="text-xl font-bold mb-8">我的收藏</h1>
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">★</p>
            <p className="text-sm text-gray-500">還沒有收藏的文章</p>
            <p className="text-xs text-gray-400 mt-1">在閱讀時點 ★ 加入收藏</p>
          </div>
        ) : (
          <div>
            {posts.map(p => (
              <BlogCard key={p.id} post={p} isRead={isRead(p.slug)} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
