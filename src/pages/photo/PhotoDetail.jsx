import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PhotoNav from '../../components/PhotoNav'
import PhotoFooter from '../../components/PhotoFooter'
import SEOHead from '../../components/SEOHead'
import MarkdownContent from '../../components/MarkdownContent'
import Lightbox from '../../components/Lightbox'
import { supabase } from '../../lib/supabase'

export default function PhotoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  function openLightbox(i) { setLightboxIndex(i) }
  function closeLightbox() { setLightboxIndex(null) }
  function prevImage() { setLightboxIndex(i => (i - 1 + (project?.images?.length ?? 1)) % (project?.images?.length ?? 1)) }
  function nextImage() { setLightboxIndex(i => (i + 1) % (project?.images?.length ?? 1)) }

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
      <PhotoFooter />
    </>
  )

  if (!project) return (
    <>
      <PhotoNav />
      <div className="max-w-4xl mx-auto px-8 py-16 text-sm text-gray-400">找不到此作品。</div>
      <PhotoFooter />
    </>
  )

  return (
    <>
      <SEOHead title={`${project.title} | r.bing recording`} description={project.description} favicon="/favicon-camera.svg" />
      <PhotoNav />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className="lg:hidden flex items-center justify-center w-9 h-9 mb-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-colors"
          aria-label="返回"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
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
              <div key={typeof url === 'string' ? url : url.url + i}
                className="relative select-none cursor-zoom-in"
                onClick={() => openLightbox(i)}
              >
                <img
                  src={typeof url === 'string' ? url : url.url}
                  alt={project.title}
                  loading="lazy"
                  draggable="false"
                  onContextMenu={e => e.preventDefault()}
                  className="w-full h-auto rounded-sm pointer-events-none hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0" onContextMenu={e => e.preventDefault()} />
              </div>
            ))}
          </div>
        )}

        {lightboxIndex !== null && (
          <Lightbox
            images={project.images}
            index={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prevImage}
            onNext={nextImage}
          />
        )}

        <MarkdownContent content={project.content} />

        <div className="mt-12">
          <Link to="/photo" className="text-xs text-gray-400 hover:text-gray-700">← 返回作品集</Link>
        </div>
      </main>
      <PhotoFooter />
    </>
  )
}
