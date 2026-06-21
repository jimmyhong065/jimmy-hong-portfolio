import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { useCourse } from '../hooks/useCourse'
import { useReadHistory } from '../hooks/useReadHistory'

export default function CourseLanding() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const preview = searchParams.get('preview') === '1'
  const { course, chapters, loading, notFound } = useCourse(slug, { preview })
  const { isRead } = useReadHistory()

  if (loading) return <div className="min-h-screen bg-white" />
  if (notFound || !course) {
    return (
      <>
        <Nav />
        <main className="max-w-3xl mx-auto px-6 py-24 text-center text-gray-500">找不到課程</main>
        <Footer />
      </>
    )
  }

  const qs = preview ? '?preview=1' : ''
  const readCount = chapters.filter(c => isRead(c.slug)).length

  return (
    <>
      <Helmet>
        <title>{course.title}</title>
        <link rel="canonical" href={`https://qa-lens.com/course/${slug}`} />
      </Helmet>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 sm:px-12 py-16">
        {course.cover_url && (
          <img src={course.cover_url} alt="" className="w-full rounded-xl mb-8 object-cover" />
        )}
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        {course.subtitle && <p className="text-lg text-gray-600 mb-4">{course.subtitle}</p>}
        {course.description && <p className="text-gray-600 leading-relaxed mb-8">{course.description}</p>}

        <p className="text-xs text-gray-400 mb-4">
          {readCount} / {chapters.length} 章已讀
        </p>

        <ol className="space-y-2">
          {chapters.map((c, i) => (
            <li key={c.slug}>
              <Link
                to={`/course/${slug}/${c.slug}${qs}`}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-300 w-6 flex-shrink-0">{i + 1}</span>
                <div className="w-14 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="flex-1 min-w-0 text-sm truncate">{c.title}</span>
                {isRead(c.slug) && <span className="text-xs text-green-600 flex-shrink-0">✓ 已讀</span>}
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </>
  )
}
