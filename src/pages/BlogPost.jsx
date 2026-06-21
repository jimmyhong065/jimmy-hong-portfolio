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
import AuthorCard from '../components/AuthorCard'
import ScrollToTop from '../components/ScrollToTop'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useActiveHeading } from '../hooks/useActiveHeading'
import { parseHeadings } from '../lib/toc'
import { supabase } from '../lib/supabase'
import { useArticleSettings } from '../hooks/useArticleSettings'
import { useSwipeNav } from '../hooks/useSwipeNav'
import { useBookmarks } from '../hooks/useBookmarks'
import { getArticleImage } from '../lib/articleImages'
import { useReadHistory } from '../hooks/useReadHistory'
import { useInfiniteRead } from '../hooks/useInfiniteRead'
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
  const completedRef = useRef(false)
  const [showComplete, setShowComplete] = useState(false)
  const [extraArticles, setExtraArticles] = useState([])
  const [loadingNext, setLoadingNext] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const [activeSlug, setActiveSlug] = useState(slug)
  const sentinelRefs = useRef([])
  const loadingRef = useRef(false)
  const { fetchNext } = useInfiniteRead(post?.tags ?? [], slug)

  // Screen Wake Lock — keep screen on while reading
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let wl = null
    navigator.wakeLock.request('screen').then(w => { wl = w }).catch(() => {})
    return () => { wl?.release().catch(() => {}) }
  }, [slug])

  // Reset guards when navigating to a different article
  useEffect(() => {
    markedRef.current = false
    completedRef.current = false
    const saved = localStorage.getItem(`scroll:${slug}`)
    if (saved) {
      setTimeout(() => window.scrollTo(0, parseInt(saved)), 100)
    } else {
      window.scrollTo(0, 0)
    }
  }, [slug])

  // Save reading position
  useEffect(() => {
    const onScroll = () => localStorage.setItem(`scroll:${slug}`, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [slug])

  // Auto-mark read when user scrolls past 80%
  useEffect(() => {
    if (progress >= 80 && !markedRef.current && slug) {
      markRead(slug)
      markedRef.current = true
    }
    if (progress >= 90 && !completedRef.current && slug && post?.title) {
      completedRef.current = true
      setShowComplete(true)
      navigator.vibrate?.([50, 30, 50])
      setTimeout(() => setShowComplete(false), 3000)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'article_completed', {
          article_title: post.title,
          article_slug: slug,
        })
      }
    }
  }, [progress, slug, markRead, post?.title])

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
      supabase.from('posts').select('title, slug').eq('published', true).is('course_id', null)
        .lt('published_at', post.published_at).order('published_at', { ascending: false }).limit(1),
      supabase.from('posts').select('title, slug').eq('published', true).is('course_id', null)
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
      .eq('published', true).is('course_id', null).contains('tags', [seriesTag])
      .order('published_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 1) setSeriesPosts(data)
      })
  }, [post?.tags])

  // Infinite read — sentinel observer (mobile only)
  useEffect(() => {
    if (!post || exhausted) return
    const sentinels = sentinelRefs.current.filter(Boolean)
    if (!sentinels.length) return
    const observer = new IntersectionObserver(
      async (entries) => {
        const triggered = entries.find(
          e => e.isIntersecting && e.target === sentinels[sentinels.length - 1]
        )
        if (!triggered || loadingRef.current) return
        loadingRef.current = true
        setLoadingNext(true)
        const next = await fetchNext()
        if (next) setExtraArticles(prev => [...prev, next])
        else setExhausted(true)
        setLoadingNext(false)
        loadingRef.current = false
      },
      { threshold: 0.1 }
    )
    sentinels.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [post, extraArticles.length, exhausted])

  // Infinite read — URL + activeSlug tracking
  useEffect(() => {
    const articles = document.querySelectorAll('[data-slug]')
    if (!articles.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            const s = e.target.dataset.slug
            setActiveSlug(s)
            window.history.replaceState(null, '', `/blog/${s}`)
          }
        })
      },
      { threshold: 0.5 }
    )
    articles.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [extraArticles.length])

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
      <div className="fixed top-0 left-0 h-[3px] z-50" style={{ width: `${progress}%`, backgroundColor: 'var(--color-accent)' }} />
      <Nav />
      <div className="max-w-3xl mx-auto px-4 md:px-12 py-16 animate-pulse">
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
          <div className="h-5 w-12 bg-gray-100 rounded-full" />
        </div>
        <div className="h-8 w-3/4 bg-gray-100 rounded mb-3" />
        <div className="h-4 w-32 bg-gray-100 rounded mb-10" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mb-3">
            <div className="h-4 w-full bg-gray-100 rounded mb-1" />
            <div className="h-4 w-5/6 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
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

  const SITE_URL = 'https://qa-lens.com'
  const postUrl = `${SITE_URL}/blog/${slug}`
  const ogImage = `${SITE_URL}${getArticleImage(post.tags ?? [])}`
  const shareText = encodeURIComponent(post.title)
  const shareUrl = encodeURIComponent(postUrl)
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
  const xShare = `https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`
  const lineShare = `https://social-plugins.line.me/lineit/share?url=${shareUrl}`

  const wordCount = post.content ? post.content.replace(/\s+/g, ' ').split(' ').length : undefined

  // Extract FAQ pairs from ## 常見問題 / ## FAQ sections
  function extractFaq(content) {
    if (!content) return []
    const section = content.match(/##\s*(?:常見問題|FAQ)[^\n]*\n([\s\S]*?)(?=\n##\s|\n---|\s*$)/i)
    if (!section) return []
    const pairs = []
    const qPattern = /\*\*Q[：:]\s*(.+?)\*\*[\s\S]*?(?:A[：:]\s*|^)([^*\n][^\n]+(?:\n(?!\*\*Q)[^\n]*)*)/gim
    let m
    while ((m = qPattern.exec(section[1])) !== null) {
      const q = m[1].trim()
      const a = m[2].trim().replace(/\n+/g, ' ')
      if (q && a) pairs.push({ q, a })
    }
    return pairs
  }
  const faqPairs = extractFaq(post.content)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': postUrl,
        headline: post.title,
        description: post.excerpt ?? '',
        datePublished: post.published_at,
        ...(post.updated_at && { dateModified: post.updated_at }),
        image: ogImage,
        inLanguage: 'zh-TW',
        ...(wordCount && { wordCount }),
        ...(post.tags?.length && {
          keywords: post.tags.join(', '),
          articleSection: post.tags[0],
        }),
        author: {
          '@type': 'Person',
          name: 'Jimmy Hong',
          url: SITE_URL,
          sameAs: ['https://github.com/jimmyhong065', 'https://qa-lens.com'],
        },
        publisher: {
          '@type': 'Organization',
          name: 'QA Lens',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/pwa-icon.png` },
        },
        url: postUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
        isPartOf: { '@type': 'Blog', '@id': `${SITE_URL}/blog`, name: 'QA Lens 技術筆記' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '文章', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
        ],
      },
      ...(faqPairs.length > 0 ? [{
        '@type': 'FAQPage',
        mainEntity: faqPairs.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }] : []),
    ],
  }

  const seriesTag = post.tags?.find(t => t.includes('系列'))

  return (
    <>
      <div className="fixed top-0 left-0 h-[3px] z-50 transition-none" style={{ width: `${progress}%`, backgroundColor: 'var(--color-accent)' }} />
      {showComplete && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg animate-fade-in-up pointer-events-none">
          ✓ 讀完了！
        </div>
      )}
      <Helmet>
        <title>{post.title} | Jimmy Hong</title>
        <meta name="description" content={post.excerpt ?? ''} />
        <link rel="canonical" href={postUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt ?? ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="article:published_time" content={post.published_at} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt ?? ''} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Nav />
      <main className={`max-w-5xl mx-auto px-6 sm:px-12 py-16 pb-28 lg:pb-16 transition-colors${dark ? ' bg-[#1a1a1a]' : ''}`}>
        <div className={headings.length >= 2 ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-12' : ''}>
          <article
            ref={swipeRef}
            data-slug={slug}
            className={`transition-colors article-font-${fontSize}${dark ? ' article-dark' : ''}`}
          >
            {/* Back — mobile: prominent row; desktop: breadcrumb */}
            <Link
              to="/blog"
              className="md:hidden flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 -ml-1 w-fit transition-colors"
              style={dark ? { color: '#9ca3af' } : {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              文章列表
            </Link>
            <Link
              to="/blog"
              className="hidden md:inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 mb-6 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              文章列表
            </Link>

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
            <MarkdownContent content={post.content?.replace(/^\s*#[^\n]*\n?/, '')} />

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
              <button
                onClick={() => toggle(slug)}
                className="hidden md:inline text-xs border px-3 py-1.5 rounded-md transition-colors"
                style={isBookmarked(slug)
                  ? { color: '#111827', borderColor: '#111827' }
                  : { color: '#6b7280', borderColor: '#e5e7eb' }}
              >
                {isBookmarked(slug) ? '★ 已收藏' : '☆ 收藏'}
              </button>
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

            {/* Author bio */}
            <AuthorCard />

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
              <Link to="/blog" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
                文章列表
              </Link>
            </div>
            {/* Infinite read sentinel */}
            <div
              ref={el => { sentinelRefs.current[0] = el }}
              className="h-1"
              aria-hidden="true"
            />
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

        {/* Infinite read — appended articles */}
        {extraArticles.map((p, i) => {
          const pMin = p.content
            ? Math.max(1, Math.ceil(p.content.replace(/\s/g, '').length / 400))
            : null
          return (
            <div key={p.slug} className="lg:max-w-3xl lg:mx-auto">
              {/* Separator */}
              <div className="my-10 flex items-center gap-3 text-xs text-gray-400">
                <div className="flex-1 border-t border-gray-200" />
                <span>下一篇</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <p className="text-sm font-semibold text-center text-gray-600 mb-8 line-clamp-2">
                {p.title}
              </p>
              <article
                data-slug={p.slug}
                className={`article-font-${fontSize}${dark ? ' article-dark' : ''}`}
              >
                {/* Back button */}
                <Link
                  to="/blog"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 -ml-1 w-fit transition-colors"
                  style={dark ? { color: '#9ca3af' } : {}}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  文章列表
                </Link>
                {/* Tags */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {(p.tags ?? []).map(t => (
                    <Link
                      key={t}
                      to={`/blog?tag=${encodeURIComponent(t)}`}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
                {/* Title + meta */}
                <h2 className="text-2xl font-bold mb-2">{p.title}</h2>
                <p className="text-xs text-gray-400 mb-10 flex items-center gap-3">
                  {p.published_at ? p.published_at.slice(0, 10) : ''}
                  {pMin && <span className="text-gray-300">·</span>}
                  {pMin && <span>{pMin} 分鐘閱讀</span>}
                </p>
                {/* Content */}
                <MarkdownContent content={p.content?.replace(/^\s*#[^\n]*\n?/, '')} />
                {/* Sentinel */}
                <div
                  ref={el => { sentinelRefs.current[i + 1] = el }}
                  className="h-1"
                  aria-hidden="true"
                />
              </article>
            </div>
          )
        })}

        {/* Loading spinner */}
        {loadingNext && (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}

        {/* End marker */}
        {exhausted && (
          <p className="text-center text-xs text-gray-400 py-12">
            — 已讀完所有相關文章 —
          </p>
        )}
      </main>
      <Footer />
      <ScrollToTop />
      <ArticleToolbar
        fontSize={fontSize}
        dark={dark}
        onInc={incFontSize}
        onDec={decFontSize}
        onToggleDark={toggleDark}
        progress={progress}
        readingMin={readingMin}
        bookmarked={isBookmarked(activeSlug)}
        onToggleBookmark={() => { navigator.vibrate?.(30); toggle(activeSlug) }}
      />
    </>
  )
}
