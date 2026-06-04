// src/pages/BlogPost.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import MarkdownContent from '../components/MarkdownContent'
import TableOfContents from '../components/TableOfContents'
import RelatedPosts from '../components/RelatedPosts'
import EmailSubscribeForm from '../components/EmailSubscribeForm'
import ScrollToTop from '../components/ScrollToTop'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useActiveHeading } from '../hooks/useActiveHeading'
import { parseHeadings } from '../lib/toc'
import { supabase } from '../lib/supabase'
import { useArticleSettings } from '../hooks/useArticleSettings'
import { useSwipeNav } from '../hooks/useSwipeNav'
import { useBookmarks } from '../hooks/useBookmarks'
import { useReadHistory } from '../hooks/useReadHistory'
import ArticleToolbar from '../components/ArticleToolbar'


export default function BlogPost() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === '1'
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adjacent, setAdjacent] = useState({ prev: null, next: null })
  const [copied, setCopied] = useState(false)
  const [seriesPosts, setSeriesPosts] = useState([])
  const progress = useReadingProgress()
  const { fontSize, dark, incFontSize, decFontSize, toggleDark } = useArticleSettings()
  const swipeRef = useSwipeNav({
    prevSlug: adjacent.prev?.slug ?? null,
    nextSlug: adjacent.next?.slug ?? null,
  })
  const { isBookmarked, toggle } = useBookmarks()
  const { markRead } = useReadHistory()
  const markedRef = useRef(false)

  // Reset the "already marked" guard when navigating to a different article
  useEffect(() => {
    markedRef.current = false
  }, [slug])

  // Auto-mark read when user scrolls past 80%
  useEffect(() => {
    if (progress >= 80 && !markedRef.current && slug) {
      markRead(slug)
      markedRef.current = true
    }
  }, [progress, slug, markRead])

  useEffect(() => {
    let q = supabase.from('posts').select('*').eq('slug', slug)
    if (!isPreview) q = q.eq('published', true)
    q.single().then(({ data }) => {
      setPost(data)
      setLoading(false)
    })
  }, [slug, isPreview])

  // Prev/next
  useEffect(() => {
    if (!post?.published_at) return
    Promise.all([
      supabase.from('posts').select('title, slug').eq('published', true)
        .lt('published_at', post.published_at).order('published_at', { ascending: false }).limit(1),
      supabase.from('posts').select('title, slug').eq('published', true)
        .gt('published_at', post.published_at).order('published_at', { ascending: true }).limit(1),
    ]).then(([prev, next]) => {
      setAdjacent({ prev: prev.data?.[0] ?? null, next: next.data?.[0] ?? null })
    })
  }, [post?.published_at])

  // Series
  useEffect(() => {
    if (!post?.tags?.length) return
    const seriesTag = post.tags.find(t => t.includes('系列'))
    if (!seriesTag) return
    supabase.from('posts').select('title, slug, published_at')
      .eq('published', true).contains('tags', [seriesTag])
      .order('published_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 1) setSeriesPosts(data)
      })
  }, [post?.tags])

  const headings = post?.content ? parseHeadings(post.content) : []
  const activeId = useActiveHeading(headings)
  const readingMin = post?.content
    ? Math.max(1, Math.ceil(post.content.replace(/\s/g, '').length / 400))
    : null

  async function copyLink(url) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <>
      <div className="fixed top-0 left-0 h-[3px] bg-gray-900 z-50" style={{ width: `${progress}%` }} />
      <Nav />
      <div className="max-w-3xl mx-auto px-4 md:px-12 py-16 text-sm text-gray-400">載入中…</div>
      <Footer />
    </>
  )
  if (!post) return (
    <>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 md:px-12 py-16 text-sm text-gray-400">找不到此文章。</div>
      <Footer />
    </>
  )

  const SITE_URL = 'https://jimmy-hong-portfolio.pages.dev'
  const postUrl = `${SITE_URL}/blog/${slug}`
  const shareText = encodeURIComponent(post.title)
  const shareUrl = encodeURIComponent(postUrl)
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
  const xShare = `https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`
  const lineShare = `https://social-plugins.line.me/lineit/share?url=${shareUrl}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? '',
    datePublished: post.published_at,
    ...(post.updated_at && { dateModified: post.updated_at }),
    author: { '@type': 'Person', name: 'Jimmy Hong', url: SITE_URL },
    publisher: { '@type': 'Person', name: 'Jimmy Hong', url: SITE_URL },
    url: postUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    ...(post.tags?.length && { keywords: post.tags.join(', ') }),
  }

  const seriesTag = post.tags?.find(t => t.includes('系列'))

  return (
    <>
      <div className="fixed top-0 left-0 h-[3px] bg-gray-900 z-50 transition-none" style={{ width: `${progress}%` }} />
      <Helmet>
        <title>{post.title} | Jimmy Hong</title>
        <meta name="description" content={post.excerpt ?? ''} />
        <link rel="canonical" href={postUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt ?? ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        <meta property="article:published_time" content={post.published_at} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt ?? ''} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Nav />
      <main className={`max-w-5xl mx-auto px-6 sm:px-12 py-16 pb-28 lg:pb-16 transition-colors${dark ? ' bg-[#1a1a1a]' : ''}`}>
        <div className={headings.length >= 2 ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-12' : ''}>
          <article
            ref={swipeRef}
            className={`transition-colors article-font-${fontSize}${dark ? ' article-dark' : ''}`}
          >
            {/* Tags */}
            <div className="flex gap-2 flex-wrap mb-3">
              {(post.tags ?? []).map(t => (
                <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors">
                  {t}
                </Link>
              ))}
            </div>

            {/* Title + meta */}
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
            <p className="text-xs text-gray-400 mb-10 flex items-center gap-3">
              {post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : ''}
              {readingMin && <span className="text-gray-300">·</span>}
              {readingMin && <span>{readingMin} 分鐘閱讀</span>}
            </p>

            {/* Series navigation */}
            {seriesPosts.length > 1 && (
              <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-widest">{seriesTag}</p>
                <ol className="flex flex-col gap-1.5">
                  {seriesPosts.map((p, i) => (
                    <li key={p.slug} className="flex items-baseline gap-2">
                      <span className="text-xs text-gray-300 w-4 flex-shrink-0">{i + 1}.</span>
                      {p.slug === slug
                        ? <span className="text-xs font-medium text-gray-900">{p.title}</span>
                        : <Link to={`/blog/${p.slug}`} className="text-xs text-gray-500 hover:text-gray-900">{p.title}</Link>
                      }
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Mobile TOC */}
            {headings.length >= 2 && (
              <div className="lg:hidden mb-8">
                <TableOfContents headings={headings} activeId={activeId} mobile />
              </div>
            )}

            {/* Content */}
            <MarkdownContent content={post.content} />

            {/* Share */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-400">分享：</span>
              {/* 手機：系統原生分享 */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={() => navigator.share({ title: post.title, url: postUrl })}
                  className="md:hidden text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400 transition-colors"
                >
                  分享
                </button>
              )}
              {/* 桌機：個別按鈕 */}
              <button onClick={() => copyLink(postUrl)}
                className="hidden md:inline text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400 transition-colors">
                {copied ? '✓ 已複製' : '複製連結'}
              </button>
              <a href={lineShare} target="_blank" rel="noreferrer"
                className="hidden md:inline text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">Line</a>
              <a href={linkedInShare} target="_blank" rel="noreferrer"
                className="hidden md:inline text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">LinkedIn</a>
              <a href={xShare} target="_blank" rel="noreferrer"
                className="hidden md:inline text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">X</a>
            </div>

            <EmailSubscribeForm />

            {/* Related posts */}
            <RelatedPosts currentSlug={slug} tags={post.tags ?? []} />

            {/* Prev / Next */}
            {(adjacent.prev || adjacent.next) && (
              <div className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  {adjacent.prev && (
                    <Link to={`/blog/${adjacent.prev.slug}`} className="block group">
                      <p className="text-xs text-gray-400 mb-1">← 上一篇</p>
                      <p className="text-sm text-gray-600 group-hover:text-gray-900 line-clamp-2">{adjacent.prev.title}</p>
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  {adjacent.next && (
                    <Link to={`/blog/${adjacent.next.slug}`} className="block group">
                      <p className="text-xs text-gray-400 mb-1">下一篇 →</p>
                      <p className="text-sm text-gray-600 group-hover:text-gray-900 line-clamp-2">{adjacent.next.title}</p>
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8">
              <Link to="/blog" className="text-xs text-gray-400 hover:text-gray-700">← 回文章列表</Link>
            </div>
          </article>

          {/* Desktop TOC */}
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
      <ScrollToTop />
      <ArticleToolbar
        fontSize={fontSize}
        dark={dark}
        onInc={incFontSize}
        onDec={decFontSize}
        onToggleDark={toggleDark}
        bookmarked={isBookmarked(slug)}
        onToggleBookmark={() => toggle(slug)}
      />
    </>
  )
}
