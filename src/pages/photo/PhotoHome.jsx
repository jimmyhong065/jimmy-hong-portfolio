import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PhotoNav from '../../components/PhotoNav'
import PhotoFooter from '../../components/PhotoFooter'
import SEOHead from '../../components/SEOHead'
import PhotoCard from '../../components/PhotoCard'
import { usePhotoProjects } from '../../hooks/usePhotoProjects'
import { useSettings } from '../../hooks/useSettings'
import { useServices } from '../../hooks/useServices'

const CALENDLY_URL = 'https://calendly.com/pklaz0078/30min'

function openCalendly() {
  window.Calendly?.initPopupWidget({ url: CALENDLY_URL })
}

export default function PhotoHome() {
  const { projects, loading } = usePhotoProjects()
  const { settings } = useSettings()
  const { services } = useServices('photo')
  const [selectedTag, setSelectedTag] = useState(null)

  const allTags = useMemo(() => {
    const set = new Set(projects.flatMap(p => p.tags ?? []))
    return [...set]
  }, [projects])

  const visible = useMemo(() =>
    selectedTag ? projects.filter(p => (p.tags ?? []).includes(selectedTag)) : projects
  , [projects, selectedTag])

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.head.removeChild(link)
      document.body.removeChild(script)
    }
  }, [])

  return (
    <>
      <SEOHead
        title="r.bing recording | 攝影作品集"
        description={settings.seo_photo_description || '給予人們自信魅力，拍出人生作品集。台灣人像攝影品牌，年代MUCH台美的in台灣專題報導。'}
        keywords={settings.seo_photo_keywords || undefined}
        favicon="/favicon-camera.svg"
      />
      <PhotoNav />

      {/* Page heading */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-14 pb-10">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 leading-none">Collection</h1>
            <span className="text-lg text-gray-400 mb-2">攝影作品</span>
          </div>
          <img src="/images/10.png" alt="" aria-hidden="true"
            className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 select-none -rotate-3 drop-shadow-md" />
        </div>
      </div>

      {/* Tag filter */}
      {!loading && allTags.length > 0 && (
        <div className="flex gap-2 px-4 md:px-8 pb-6 flex-wrap">
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${!selectedTag ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-400'}`}>
            全部
          </button>
          {allTags.map(tag => (
            <button key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${selectedTag === tag ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-400'}`}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Full-width 3-col grid */}
      {loading ? (
        <p className="text-sm text-gray-400 px-8 pb-16">載入中…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-400 px-8 pb-16">沒有符合的作品。</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
          {visible.map(p => (
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
            <p className="text-xs text-gray-500">給予人們自信魅力，拍出人生作品集</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openCalendly}
              className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
              預約諮詢
            </button>
            <a href="https://www.instagram.com/r.bing_recording/" target="_blank" rel="noreferrer"
              className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-md">
              Instagram
            </a>
          </div>
        </div>

        {/* Brand story */}
        <div className="py-16 border-b border-gray-100">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-10">Our Story</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
                每個人都值得擁有<br />一張讓自己驕傲的照片
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                r.bing recording 相信，攝影不只是記錄外貌，而是一場發現自己的旅程。我們專注於人像攝影，從婚紗、寫真到閨蜜、生日紀念，每一次拍攝都是一次對話——用鏡頭說出你說不出口的自信。
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                很多客人在拍攝前說「我不上鏡」，在拍攝後說「這是我看過最好看的自己」。這句話，是我們最大的成就感來源。
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                攝影師 r.bing 曾受年代 MUCH 台《美的 in 台灣》專題報導，以「給予人們自信魅力，拍出人生作品集」的理念，持續記錄每一位走進鏡頭前的你。
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <blockquote className="border-l-2 border-gray-900 pl-5">
                <p className="text-lg font-medium text-gray-900 leading-relaxed">
                  「拍照不是為了讓你變成別人，<br />而是讓你看見最好的自己。」
                </p>
                <cite className="text-xs text-gray-400 mt-3 block">— r.bing</cite>
              </blockquote>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">年代 MUCH 台 專題報導</p>
                  <p className="text-xs text-gray-400">《美的 in 台灣 — 幸福推手》</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intro video */}
        <div className="py-16 border-b border-gray-100">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-6">年代 MUCH 台 — 美的 in 台灣</p>
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

      <PhotoFooter />
    </>
  )
}
