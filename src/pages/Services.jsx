import { useEffect } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import { useServices } from '../hooks/useServices'
import { useSettings } from '../hooks/useSettings'

const CALENDLY_URL = 'https://calendly.com/pklaz0078/30min'

function openCalendly() {
  window.Calendly?.initPopupWidget({ url: CALENDLY_URL })
}

export default function Services() {
  const { services: qaServices } = useServices('qa')
  const { services: photoServices } = useServices('photo')
  const { settings } = useSettings()

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.head.removeChild(link); document.body.removeChild(script) }
  }, [])

  return (
    <>
      <SEOHead
        title="合作方式"
        description="QA 測試顧問諮詢、自動化導入、攝影接案服務。歡迎洽談合作。"
      />
      <Nav />
      <main className="max-w-5xl mx-auto px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Services</p>
        <h1 className="text-xl font-bold mb-2">合作方式</h1>
        <p className="text-sm text-gray-500 mb-14">
          QA 流程顧問與攝影接案，歡迎依需求洽談。
        </p>

        {/* QA Services */}
        <section className="mb-16">
          <div className="flex items-end gap-3 mb-8">
            <h2 className="text-lg font-bold">QA 顧問服務</h2>
            <span className="text-xs text-gray-400 mb-0.5">Software Quality</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {qaServices.map(s => (
              <div key={s.id} className="border border-gray-200 rounded-xl p-6 hover:border-gray-400 transition-colors">
                <h3 className="text-sm font-semibold mb-3">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{s.description}</p>
                {s.price && (
                  <p className="text-xs font-medium text-gray-700">{s.price}</p>
                )}
              </div>
            ))}
          </div>
          {settings.email && (
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">有 QA 相關需求？</p>
                <p className="text-xs text-gray-500">歡迎來信說明專案背景，我會在 48 小時內回覆。</p>
              </div>
              <a href={`mailto:${settings.email}?subject=QA 顧問合作洽詢`}
                className="text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700 whitespace-nowrap">
                寄信洽詢
              </a>
            </div>
          )}
        </section>

        <hr className="border-gray-100 mb-16" />

        {/* Photo Services */}
        <section>
          <div className="flex items-end gap-3 mb-8">
            <h2 className="text-lg font-bold">攝影接案服務</h2>
            <span className="text-xs text-gray-400 mb-0.5">r.bing recording</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {photoServices.map(s => (
              <div key={s.id} className="border border-gray-200 rounded-xl p-6 hover:border-gray-400 transition-colors">
                <h3 className="text-sm font-semibold mb-3">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{s.description}</p>
                {s.price && (
                  <p className="text-xs font-medium text-gray-700">{s.price}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">想預約拍攝？</p>
              <p className="text-xs text-gray-500">點擊下方按鈕查看可預約時段，選擇最適合的時間。</p>
            </div>
            <button onClick={openCalendly}
              className="text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700 whitespace-nowrap">
              預約諮詢
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
