import { Link } from 'react-router-dom'
import PhotoNav from '../../components/PhotoNav'
import Footer from '../../components/Footer'
import SEOHead from '../../components/SEOHead'
import PhotoCard from '../../components/PhotoCard'
import { usePhotoProjects } from '../../hooks/usePhotoProjects'
import { useSettings } from '../../hooks/useSettings'
import { useServices } from '../../hooks/useServices'

export default function PhotoHome() {
  const { projects, loading } = usePhotoProjects()
  const { settings } = useSettings()
  const { services } = useServices('photo')

  return (
    <>
      <SEOHead title="r.bing recording | 攝影作品集" description="用鏡頭記錄真實的瞬間。" favicon="/favicon-camera.svg" />
      <PhotoNav />

      {/* Page heading */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-14 pb-10">
        <div className="flex items-end gap-4">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 leading-none">Collection</h1>
          <span className="text-lg text-gray-400 mb-2">攝影作品</span>
        </div>
      </div>

      {/* Full-width 3-col grid */}
      {loading ? (
        <p className="text-sm text-gray-400 px-8 pb-16">載入中…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-gray-400 px-8 pb-16">尚無作品。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
          {projects.map(p => (
            <div key={p.id} className="bg-white">
              <PhotoCard project={p} />
            </div>
          ))}
        </div>
      )}

      {/* Info + Services */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Brand strip */}
        <div className="flex items-center gap-4 py-12 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            {settings.photo_avatar_url && <img src={settings.photo_avatar_url} alt="r.bing recording" className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">r.bing recording</p>
            <p className="text-xs text-gray-500">用鏡頭記錄真實的瞬間</p>
          </div>
          <div className="flex items-center gap-3">
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                預約洽詢
              </a>
            )}
            <a href="https://www.instagram.com/r.bing_recording/" target="_blank" rel="noreferrer"
              className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-md">
              Instagram
            </a>
          </div>
        </div>

        {/* Intro video */}
        <div className="py-16 border-b border-gray-100">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-6">About Us</p>
          <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl bg-gray-100">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/ioFycKsYpBE"
              title="r.bing recording 攝影師介紹"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div className="py-16">
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-8">Services</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map(s => (
                <div key={s.id}>
                  <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <Footer />
    </>
  )
}
