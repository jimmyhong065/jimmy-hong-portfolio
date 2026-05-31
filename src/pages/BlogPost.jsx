// src/pages/BlogPost.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import MarkdownContent from '../components/MarkdownContent'
import TableOfContents from '../components/TableOfContents'
import RelatedPosts from '../components/RelatedPosts'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useActiveHeading } from '../hooks/useActiveHeading'
import { parseHeadings } from '../lib/toc'
import { supabase } from '../lib/supabase'

export default function BlogPost() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === '1'
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const progress = useReadingProgress()

  useEffect(() => {
    let query = supabase.from('posts').select('*').eq('slug', slug)
    if (!isPreview) query = query.eq('published', true)
    query.single().then(({ data }) => {
      setPost(data)
      setLoading(false)
    })
  }, [slug, isPreview])

  const headings = post?.content ? parseHeadings(post.content) : []
  const activeId = useActiveHeading(headings)
  const readingMin = post?.content
    ? Math.max(1, Math.ceil(post.content.replace(/\s/g, '').length / 400))
    : null

  if (loading) return (
    <>
      <div className="fixed top-0 left-0 h-[3px] bg-gray-900 z-50" style={{ width: `${progress}%` }} />
      <Nav />
      <div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">載入中…</div>
      <Footer />
    </>
  )
  if (!post) return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">找不到此文章。</div>
      <Footer />
    </>
  )

  const postUrl = `${window.location.origin}/blog/${slug}`
  const shareText = encodeURIComponent(post.title)
  const shareUrl = encodeURIComponent(postUrl)
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
  const xShare = `https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`
  const lineShare = `https://social-plugins.line.me/lineit/share?url=${shareUrl}`

  return (
    <>
      <div
        className="fixed top-0 left-0 h-[3px] bg-gray-900 z-50 transition-none"
        style={{ width: `${progress}%` }}
      />
      <Helmet>
        <title>{post.title} | Jimmy Hong</title>
        <meta name="description" content={post.excerpt ?? ''} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt ?? ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
      </Helmet>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
        <div className={headings.length >= 2 ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-12' : ''}>
          <article>
            <div className="flex gap-2 flex-wrap mb-3">
              {(post.tags ?? []).map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
            <p className="text-xs text-gray-400 mb-10 flex items-center gap-3">
              {post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : ''}
              {readingMin && (
                <span className="text-gray-300">·</span>
              )}
              {readingMin && (
                <span>{readingMin} 分鐘閱讀</span>
              )}
            </p>
            {headings.length >= 2 && (
              <div className="lg:hidden mb-8">
                <TableOfContents headings={headings} activeId={activeId} mobile />
              </div>
            )}
            <MarkdownContent content={post.content} />
            <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-4">
              <span className="text-xs text-gray-400">分享：</span>
              <a href={lineShare} target="_blank" rel="noreferrer"
                className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">
                Line
              </a>
              <a href={linkedInShare} target="_blank" rel="noreferrer"
                className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">
                LinkedIn
              </a>
              <a href={xShare} target="_blank" rel="noreferrer"
                className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">
                X
              </a>
            </div>
            <RelatedPosts currentSlug={slug} tags={post.tags ?? []} />
            <div className="mt-8">
              <Link to="/blog" className="text-xs text-gray-400 hover:text-gray-700">← 回文章列表</Link>
            </div>
          </article>
          {headings.length >= 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents headings={headings} activeId={activeId} />
              </div>
            </aside>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
