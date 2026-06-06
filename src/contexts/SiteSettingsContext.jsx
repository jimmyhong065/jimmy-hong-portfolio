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
      applyTheme({ accent_color: data.accent_color, font_family: data.font_family, bg_color: data.bg_color })
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
