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
      .then(({ data }) => {
        setProject(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <>
      <PhotoNav />
      <div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">載入中…</div>
      <Footer />
    </>
  )

  if (!project) return (
    <>
      <PhotoNav />
      <div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">找不到此作品。</div>
      <Footer />
    </>
  )

  return (
    <>
      <SEOHead title={project.title} description={project.description} />
      <PhotoNav />
      <main className="max-w-3xl mx-auto px-12 py-16">
        <div className="flex gap-2 flex-wrap mb-3">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-8">{project.title}</h1>

        {/* Image gallery */}
        {(project.images ?? []).length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-10">
            {project.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${project.title} ${i + 1}`}
                className="w-full rounded-xl object-cover aspect-[4/3] border border-gray-100"
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
