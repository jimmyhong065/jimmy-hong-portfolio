import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import ProjectCard from '../components/ProjectCard'
import BlogRow from '../components/BlogRow'
import { usePosts } from '../hooks/usePosts'
import { useProjects } from '../hooks/useProjects'
import { useSettings } from '../hooks/useSettings'
import { useServices } from '../hooks/useServices'

export default function Home() {
  const { posts } = usePosts()
  const { projects } = useProjects()
  const { settings } = useSettings()
  const { services } = useServices('qa')

  return (
    <>
      <SEOHead />
      <Nav />
      <main>
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-4 md:px-12 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <div className="flex gap-7 items-start">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden ring-2 ring-gray-100 ring-offset-2">
                {settings.avatar_url && <img src={settings.avatar_url} alt="Jimmy Hong" className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">QA Engineer / 品質架構師</p>
                <h1 className="text-3xl font-bold mb-1">Jimmy Hong</h1>
                <p className="text-sm text-gray-500 mb-4">打造讓團隊信任的 QA 系統</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  專注測試流程設計與品質架構。<br />
                  從流程標準化到自動化導入，<br />
                  讓品質成為開發文化，而不是最後一道關卡。
                </p>
                <div className="flex gap-2 flex-wrap mb-6">
                  {['測試策略', 'CI/CD 整合', '自動化框架', 'QA 流程設計'].map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <a href="/projects" className="text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700">看作品集</a>
                  <a href="/blog" className="text-xs text-gray-500 border-b border-gray-300 pb-px hover:text-gray-900">閱讀文章</a>
                  <div className="flex gap-2 ml-1">
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
                    {settings.email && (
                      <a href={`mailto:${settings.email}`} className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-gray-500 hover:border-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Services card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7">
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Services</p>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {services.map(s => (
                <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-600">{s.title}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {[['3+', '年 QA 經驗'], [`${projects.length}`, '專案'], [`${posts.length}`, '文章']].map(([n, l]) => (
                <div key={l} className="flex-1 bg-gray-100 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold">{n}</div>
                  <div className="text-xs text-gray-400">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-gray-100 mx-12" />

        {/* Dual identity */}
        <section className="max-w-5xl mx-auto px-4 md:px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">兩個身份，一個視角</p>
          <h2 className="text-xl font-bold mb-2">用 QA 的嚴謹對待細節，<br className="hidden sm:block" />用攝影的眼光捕捉瞬間</h2>
          <p className="text-sm text-gray-500 mb-10">工程師的理性與攝影師的感性，在同一個人身上找到平衡。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <a href="/projects"
              className="group border border-gray-200 rounded-2xl p-8 hover:border-gray-900 transition-colors">
              <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">QA Engineering</p>
              <h3 className="text-lg font-bold mb-3 group-hover:text-gray-900">測試流程 × 品質架構</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                從測試策略規劃到自動化導入，讓品質成為開發文化，而不是最後一道關卡。
              </p>
              <span className="text-xs text-gray-900 border-b border-gray-400 pb-px">查看 QA 作品集 →</span>
            </a>
            <a href="/photo"
              className="group border border-gray-200 rounded-2xl p-8 hover:border-gray-900 transition-colors">
              <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Photography</p>
              <h3 className="text-lg font-bold mb-3 group-hover:text-gray-900">人像攝影 × 品牌視覺</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                給予人們自信魅力，拍出人生作品集。年代 MUCH 台《美的 in 台灣》報導攝影師。
              </p>
              <span className="text-xs text-gray-900 border-b border-gray-400 pb-px">查看攝影作品集 →</span>
            </a>
          </div>
        </section>

        <hr className="border-gray-100 mx-12" />

        {/* Featured projects */}
        <section className="max-w-5xl mx-auto px-4 md:px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">精選作品</p>
          <h2 className="text-xl font-bold mb-8">QA 作品集</h2>
          <div className="grid grid-cols-3 gap-5">
            {projects.slice(0, 3).map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>

        <hr className="border-gray-100 mx-12" />

        {/* Recent posts */}
        <section className="max-w-5xl mx-auto px-4 md:px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">近期文章</p>
          <h2 className="text-xl font-bold mb-2">部落格</h2>
          <div>
            {posts.slice(0, 3).map(p => <BlogRow key={p.id} post={p} />)}
          </div>
        </section>

        <hr className="border-gray-100 mx-12" />

        {/* Services */}
        <section className="max-w-5xl mx-auto px-4 md:px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">合作方式</p>
          <h2 className="text-xl font-bold mb-8">Services</h2>
          <div className="grid grid-cols-3 gap-4">
            {services.map(s => (
              <div key={s.id} className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
