import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/theme'

const DEFAULT_SETTINGS = {
  accent_color: '#111827',
  font_family: 'Noto Sans TC',
  bg_color: '#ffffff',
  hidden_pages: [],
  hidden_sections: [],
  nav_tabs: null,
  email: '',
  github_url: '',
  linkedin_url: '',
  avatar_url: '',
  photo_avatar_url: '',
  seo_keywords: '',
  seo_description: '',
  seo_photo_keywords: '',
  seo_photo_description: '',
  brand_name: 'QA Lab',
  cta_text: '聯絡我',
  card_style: 'shadowed',
  heading_font: 'Noto Sans TC',
  hero_name: 'Jimmy Hong',
  hero_subtitle: 'QA Engineer / 品質架構師',
  hero_tagline: '打造讓團隊信任的 QA 系統',
  hero_description: '專注測試流程設計與品質架構。\n從流程標準化到自動化導入，\n讓品質成為開發文化，而不是最後一道關卡。',
  hero_skills: ['測試策略', 'CI/CD 整合', '自動化框架', 'QA 流程設計'],
}

const SiteSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: () => {},
})

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
    if (data) {
      setSettings({ ...DEFAULT_SETTINGS, ...data })
      applyTheme({
        accent_color: data.accent_color,
        font_family: data.font_family,
        bg_color: data.bg_color,
        heading_font: data.heading_font,
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchSettings() }, [])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
