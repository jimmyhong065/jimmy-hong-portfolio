import PhotoNav from '../../components/PhotoNav'
import Footer from '../../components/Footer'
import SEOHead from '../../components/SEOHead'
import PhotoCard from '../../components/PhotoCard'
import { usePhotoProjects } from '../../hooks/usePhotoProjects'
import { useSettings } from '../../hooks/useSettings'

const PHOTO_SERVICES = [
  { icon: '📸', title: '人像攝影', desc: '個人形象照、畢業照、情侶寫真' },
  { icon: '🎪', title: '活動紀錄', desc: '演唱會、展覽、品牌活動現場攝影' },
  { icon: '🏢', title: '商業攝影', desc: '商品拍攝、品牌視覺、空間攝影' },
]

export default function PhotoHome() {
  const { projects, loading } = usePhotoProjects()
  const { settings } = useSettings()

  return (
    <>
      <SEOHead title="r.bing recording" description="用鏡頭記錄真實的瞬間。" />
      <PhotoNav />
      <main>
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-12 py-20">
          <div className="flex gap-7 items-start mb-16">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden ring-2 ring-gray-100 ring-offset-2">
              <img
                src={settings.avatar_url || '/avatar.jpg'}
                alt="r.bing recording"
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
            <div>
              <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">Photography Studio</p>
              <h1 className="text-3xl font-bold mb-1">r.bing recording</h1>
              <p className="text-sm text-gray-500 mb-4">用鏡頭記錄真實的瞬間</p>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                專注人像與生活紀錄攝影。<br />
                每一張照片都是一個故事的開始。
              </p>
              <div className="flex items-center gap-3">
                {settings.email && (
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700"
                  >
                    預約洽詢
                  </a>
                )}
                <a
                  href="https://www.instagram.com/r.bing_recording/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400"
                >
                  ig
                </a>
              </div>
            </div>
          </div>

          {/* Projects grid */}
          <div className="mb-16">
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Portfolio</p>
            <h2 className="text-xl font-bold mb-8">攝影作品</h2>
            {loading ? (
              <p className="text-sm text-gray-400">載入中…</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-gray-400">尚無作品。</p>
            ) : (
              <div className="grid grid-cols-3 gap-5">
                {projects.map(p => <PhotoCard key={p.id} project={p} />)}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">合作方式</p>
            <h2 className="text-xl font-bold mb-8">Services</h2>
            <div className="grid grid-cols-3 gap-5">
              {PHOTO_SERVICES.map(s => (
                <div key={s.title} className="border border-gray-200 rounded-xl p-6">
                  <div className="text-2xl mb-3">{s.icon}</div>
                  <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
