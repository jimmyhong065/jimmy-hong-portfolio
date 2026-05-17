import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PhotoNav from '../../components/PhotoNav'
import Footer from '../../components/Footer'
import SEOHead from '../../components/SEOHead'
import MarkdownContent from '../../components/MarkdownContent'
import { supabase } from '../../lib/supabase'

export default function PhotoDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('photo_projects')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error) setProject(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <>
      <PhotoNav />
      <div className="max-w-4xl mx-auto px-8 py-16 text-sm text-gray-400">載入中…</div>
      <Footer />
    </>
  )

  if (!project) return (
    <>
      <PhotoNav />
      <div className="max-w-4xl mx-auto px-8 py-16 text-sm text-gray-400">找不到此作品。</div>
      <Footer />
    </>
  )

  return (
    <>
      <SEOHead title={`${project.title} | r.bing recording`} description={project.description} />
      <PhotoNav />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="flex gap-2 flex-wrap mb-3">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs text-gray-400">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-10">{project.title}</h1>

        {/* Masonry image gallery */}
        {(project.images ?? []).length > 0 && (
          <div className="columns-1 md:columns-2 gap-4 [&>*]:break-inside-avoid [&>*]:mb-4 mb-12">
            {project.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${project.title} ${i + 1}`}
                className="w-full h-auto rounded-sm"
              />
            ))}
          </div>
        )}

        <MarkdownContent content={project.content} />

        <div className="mt-12">
          <Link to="/photo" className="text-xs text-gray-400 hover:text-gray-700">← 返回作品集</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
