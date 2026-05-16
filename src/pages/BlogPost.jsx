import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import MarkdownContent from '../components/MarkdownContent'
import { supabase } from '../lib/supabase'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
      .then(({ data }) => {
        setPost(data)
        setLoading(false)
      })
  }, [slug])

  if (loading) return <><Nav /><div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">載入中…</div><Footer /></>
  if (!post) return <><Nav /><div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">找不到此文章。</div><Footer /></>

  const postUrl = `${window.location.origin}/blog/${slug}`
  const shareText = encodeURIComponent(post.title)
  const shareUrl = encodeURIComponent(postUrl)
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
  const xShare = `https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`

  return (
    <>
      <Helmet>
        <title>{post.title} | Jimmy Hong</title>
        <meta name="description" content={post.excerpt ?? ''} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt ?? ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
      </Helmet>
      <Nav />
      <main className="max-w-3xl mx-auto px-12 py-16">
        <div className="flex gap-2 flex-wrap mb-3">
          {(post.tags ?? []).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
        <p className="text-xs text-gray-400 mb-10">
          {post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : ''}
        </p>
        <MarkdownContent content={post.content} />
        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-4">
          <span className="text-xs text-gray-400">分享：</span>
          <a href={linkedInShare} target="_blank" rel="noreferrer" className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">LinkedIn</a>
          <a href={xShare} target="_blank" rel="noreferrer" className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">X (Twitter)</a>
        </div>
        <div className="mt-8">
          <Link to="/blog" className="text-xs text-gray-400 hover:text-gray-700">← 回文章列表</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
