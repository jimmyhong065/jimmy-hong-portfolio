import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import { useSettings } from '../hooks/useSettings'
import { useServices } from '../hooks/useServices'

const SKILLS = [
  { category: '自動化測試', items: ['Appium', 'Selenium WebDriver', 'pytest', 'Playwright', 'TestProject'] },
  { category: '性能測試', items: ['JMeter', 'k6'] },
  { category: '語言與框架', items: ['Python', 'PHP', 'C#', 'Laravel', 'FastAPI'] },
  { category: '資料與監控', items: ['PostgreSQL', 'MySQL', 'MSSQL', 'Grafana', 'Prometheus'] },
  { category: '工具與平台', items: ['Fiddler', 'Charles', 'BrowserStack', 'Selenium Grid', 'Uptime Kuma', 'Linux', 'GitHub Actions'] },
]

const EXPERIENCE = [
  {
    company: 'Seekrtech',
    role: 'QA Engineer',
    period: '2023 — 現在',
    points: [
      '建立 iOS/Android Mobile App 自動化測試框架，導入 Appium + CI/CD 讓回歸週期大幅縮短',
      '設計 QA 流程規範與品質儀表板，讓品質指標可視化、可追蹤',
    ],
  },
  {
    company: '奇點無限科技',
    role: '軟體測試工程師',
    period: '2022 — 2023',
    points: [
      '負責來電顯示盒軟硬體整合測試，覆蓋 Windows 11 與迷你電腦環境',
      '協助瓦斯數位訂單平台、司機配送 APP、貨運排班系統的功能與 API 測試',
      '使用 K6 開發微服務性能報表後台；結合 ChatGPT 開發地圖微服務視覺化工具',
      '使用 PostgreSQL 設計 fake data API，以 Laravel 產生測試資料',
    ],
  },
  {
    company: '新蛋科技',
    role: '自動化測試工程師',
    period: '2021 — 2022',
    points: [
      '負責 APP UI 功能測試、異常處理，結合 TestProject + BrowserStack 執行性能測試',
      '以 Appium + pytest 建立回歸測試自動化流程（多帳號登入、信用卡、商品搜尋等）',
      '使用 Grafana 整合測試數據並製作可視化報表',
    ],
  },
  {
    company: '誠雲科技',
    role: 'PHP 工程師',
    period: '2020 — 2021',
    points: [
      '使用 Laravel 維護資產管理系統後台',
      '參與 Windows GCB 電腦政策管理系統開發，從代理程式資料回收到資安數據呈現',
    ],
  },
]

export default function About() {
  const { settings } = useSettings()
  const { services } = useServices('qa')

  return (
    <>
      <SEOHead title="關於我" description="洪裕彬 — QA Engineer，具備自動化、API、性能測試與後端開發背景。" canonical="/about" />
      <Nav />
      <main className="max-w-2xl mx-auto px-4 md:px-12 py-16">

        {/* Header */}
        <div className="flex gap-6 items-start mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden ring-2 ring-gray-100 ring-offset-2">
            {settings?.avatar_url && <img src={settings.avatar_url} alt="Jimmy Hong" className="w-full h-full object-cover" />}
          </div>
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">About</p>
            <h1 className="text-2xl font-bold mb-1">洪裕彬 Jimmy Hong</h1>
            <p className="text-sm text-gray-500">QA Engineer · 中山醫學大學應用資訊系</p>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-gray-600 leading-relaxed mb-10">
          從網路硬體、PHP 後端開發到專職 QA，跨越多個技術領域的背景讓我能從不同角度看待品質問題。
          <br /><br />
          歷經手動測試、API 測試、自動化框架建置到性能測試，目前專注於幫助團隊設計可量測的 QA 系統——整合測試數據、自動化流程與品質儀表板，讓品質管理從「救火」轉為「預防」。
          <br /><br />
          喜歡把工作中解決過的問題整理成文章，持續透過知識分享提升團隊測試能力。
        </p>

        <hr className="border-gray-100 mb-10" />

        {/* Skills */}
        <h2 className="text-sm font-semibold mb-5">技能</h2>
        <div className="flex flex-col gap-4 mb-10">
          {SKILLS.map(group => (
            <div key={group.category} className="flex gap-4 items-start">
              <span className="text-xs text-gray-400 w-24 flex-shrink-0 pt-0.5">{group.category}</span>
              <div className="flex gap-1.5 flex-wrap">
                {group.items.map(s => (
                  <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <hr className="border-gray-100 mb-10" />

        {/* Experience */}
        <h2 className="text-sm font-semibold mb-6">工作經歷</h2>
        <div className="flex flex-col gap-8 mb-10">
          {EXPERIENCE.map(e => (
            <div key={e.company}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-semibold">{e.role} · {e.company}</span>
                <span className="text-xs text-gray-400">{e.period}</span>
              </div>
              <ul className="mt-2 flex flex-col gap-1">
                {e.points.map((p, i) => (
                  <li key={i} className="text-xs text-gray-500 leading-relaxed pl-3 relative before:content-['–'] before:absolute before:left-0 before:text-gray-300">{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {services.length > 0 && (
          <>
            <hr className="border-gray-100 mb-10" />
            <h2 className="text-sm font-semibold mb-4">合作方式</h2>
            <div className="grid grid-cols-1 gap-4 mb-10">
              {services.map(s => (
                <div key={s.id} className="border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        {settings.email && (
          <a href={`mailto:${settings.email}`} className="inline-block text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700">
            聯絡我
          </a>
        )}
        <div className="flex gap-2 mt-4">
          {settings.github_url && (
            <a href={settings.github_url} target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-gray-500 hover:border-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
            </a>
          )}
          {settings.linkedin_url && (
            <a href={settings.linkedin_url} target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-gray-500 hover:border-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          )}
        </div>

      </main>
      <Footer />
    </>
  )
}
