import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import MarkdownContent from '../components/MarkdownContent'
import { supabase } from '../lib/supabase'
import { useCourse, adjacentChapters } from '../hooks/useCourse'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useReadHistory } from '../hooks/useReadHistory'

export default function CourseChapter() {
  const { slug, chapterSlug } = useParams()
  const [searchParams] = useSearchParams()
  const preview = searchParams.get('preview') === '1'
  const qs = preview ? '?preview=1' : ''

  const { course, chapters } = useCourse(slug, { preview })
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const progress = useReadingProgress()
  const { markRead } = useReadHistory()
  const markedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    markedRef.current = false
    let q = supabase.from('posts').select('*').eq('slug', chapterSlug)
    if (!preview) q = q.eq('published', true)
    q.single().then(({ data }) => {
      if (cancelled) return
      setPost(data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [chapterSlug, preview])

  useEffect(() => {
    if (progress >= 80 && !markedRef.current && chapterSlug) {
      markRead(chapterSlug)
      markedRef.current = true
    }
  }, [progress, chapterSlug, markRead])

  const { prev, next } = adjacentChapters(chapters, chapterSlug)

  if (loading) return <div className="min-h-screen bg-white" />
  if (!post) {
    return (
      <>
        <Nav />
        <main className="max-w-3xl mx-auto px-6 py-24 text-center text-gray-500">找不到章節</main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{post.title}{course ? ` — ${course.title}` : ''}</title>
        <link rel="canonical" href={`https://qa-lens.com/course/${slug}/${chapterSlug}`} />
      </Helmet>
      <div className="fixed top-0 left-0 h-0.5 bg-gray-900 z-50 transition-all" style={{ width: `${progress}%` }} />
      <Nav />
      <main className="max-w-3xl mx-auto px-6 sm:px-12 py-16">
        <Link to={`/course/${slug}${qs}`} className="text-xs text-gray-400 hover:text-gray-700 mb-6 inline-block">
          ← {course?.title ?? '課程'}
        </Link>
        <h1 className="text-2xl font-bold mb-8">{post.title}</h1>
        <MarkdownContent content={post.content?.replace(/^\s*#[^\n]*\n?/, '')} />

        <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
          {prev ? (
            <Link to={`/course/${slug}/${prev.slug}${qs}`} className="text-sm text-gray-600 hover:text-gray-900">
              ← {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/course/${slug}/${next.slug}${qs}`} className="text-sm text-gray-600 hover:text-gray-900 text-right">
              {next.title} →
            </Link>
          ) : <span />}
        </div>
      </main>
      <Footer />
    </>
  )
}
