import PhotoNav from '../../components/PhotoNav'
import Footer from '../../components/Footer'
import SEOHead from '../../components/SEOHead'
import PhotoCard from '../../components/PhotoCard'
import { usePhotoProjects } from '../../hooks/usePhotoProjects'
import { useSettings } from '../../hooks/useSettings'

const PHOTO_SERVICES = [
  { title: '人像攝影', desc: '個人形象照、畢業照、情侶寫真' },
  { title: '活動紀錄', desc: '演唱會、展覽、品牌活動現場攝影' },
  { title: '商業攝影', desc: '商品拍攝、品牌視覺、空間攝影' },
]

export default function PhotoHome() {
  const { projects, loading } = usePhotoProjects()
  const { settings } = useSettings()

  return (
    <>
      <SEOHead title="r.bing recording | 攝影作品集" description="用鏡頭記錄真實的瞬間。" />
      <PhotoNav />
      <main className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Hero — minimized */}
        <div className="flex items-center gap-4 py-10 border-b border-gray-100 mb-10">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            <img
              src={settings.avatar_url || '/avatar.jpg'}
              alt="r.bing recording"
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">r.bing recording</p>
            <p className="text-xs text-gray-500">用鏡頭記錄真實的瞬間</p>
          </div>
          <div className="flex items-center gap-3">
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                預約洽詢
              </a>
            )}
            <a
              href="https://www.instagram.com/r.bing_recording/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-md"
            >
              Instagram
            </a>
          </div>
        </div>

        {/* Masonry gallery */}
        {loading ? (
          <p className="text-sm text-gray-400 py-8">載入中…</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-400 py-8">尚無作品。</p>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [&>*]:break-inside-avoid [&>*]:mb-6 mb-16">
            {projects.map(p => <PhotoCard key={p.id} project={p} />)}
          </div>
        )}

        {/* Services */}
        <div className="mt-16 mb-20 border-t border-gray-100 pt-12">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-8">Services</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PHOTO_SERVICES.map(s => (
              <div key={s.title}>
                <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
