import { Link } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'

export default function AuthorCard() {
  const { settings } = useSiteSettings()
  const avatar = settings.avatar_url
  const github = settings.github_url
  const linkedin = settings.linkedin_url

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <div className="flex gap-4 items-start bg-gray-50 border border-gray-100 rounded-2xl p-5">
        <Link to="/about" className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white ring-offset-1">
            {avatar && <img src={avatar} alt="Jimmy Hong" className="w-full h-full object-cover" />}
          </div>
        </Link>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <Link to="/about" className="text-sm font-semibold text-gray-900 hover:text-teal-700 transition-colors">Jimmy Hong</Link>
            <span className="text-xs text-gray-400">QA Engineer</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            專注測試流程設計與品質架構，從 Appium 行動測試到 CI/CD 整合。把工作中解決過的問題整理成文章，持續分享 QA 實戰經驗。
          </p>
          <div className="flex items-center gap-3">
            <Link to="/about" className="text-xs text-teal-700 border-b border-teal-300 pb-px hover:border-teal-600 transition-colors">關於作者 →</Link>
            {github && (
              <a href={github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors" aria-label="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
              </a>
            )}
            {linkedin && (
              <a href={linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
