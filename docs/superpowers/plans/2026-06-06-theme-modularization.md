# Theme Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin to control accent color, font family, and page visibility from the admin panel — applied at runtime with no redeploy needed.

**Architecture:** Extend the existing Supabase `settings` table with three new columns. On app boot, fetch settings once via a new `SiteSettingsContext` and apply CSS custom properties + Google Font. Admin panel live-previews changes before saving.

**Tech Stack:** React Context, tinycolor2, CSS custom properties, Google Fonts, Supabase

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/theme.js` | Color derivation + CSS variable injection + font loading |
| Create | `src/lib/__tests__/theme.test.js` | Unit tests for theme utilities |
| Create | `src/contexts/SiteSettingsContext.jsx` | Single Supabase fetch, exposes settings + refresh |
| Modify | `src/App.jsx` | Wrap with provider, add HiddenRoute for page visibility |
| Modify | `src/components/Nav.jsx` | Use SiteSettingsContext, filter desktop links by hidden_pages |
| Modify | `src/pages/admin/AdminSettings.jsx` | Add 外觀設定 section |
| Modify | `src/pages/BlogPost.jsx` | Progress bar uses CSS var instead of hardcoded gray-900 |
| Modify | `src/components/ArticleToolbar.jsx` | Progress bar uses CSS var |

---

## Task 1: Install tinycolor2 + Supabase migration

**Files:**
- Run: `npm install tinycolor2`
- Run Supabase SQL migration (manual step)

- [ ] **Step 1: Install tinycolor2**

```bash
npm install tinycolor2
```

Expected output: package added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Run Supabase migration**

In Supabase dashboard → SQL Editor, run:

```sql
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS font_family  text DEFAULT 'Noto Sans TC',
  ADD COLUMN IF NOT EXISTS hidden_pages text[] DEFAULT '{}';
```

Verify: go to Table Editor → settings → confirm the three new columns exist with the defaults.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install tinycolor2 for theme color derivation"
```

---

## Task 2: Create src/lib/theme.js

**Files:**
- Create: `src/lib/theme.js`
- Create: `src/lib/__tests__/theme.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/theme.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deriveColorPalette, applyTheme } from '../theme'

describe('deriveColorPalette', () => {
  it('returns accent as hex string matching input', () => {
    const p = deriveColorPalette('#3b82f6')
    expect(p.accent.toLowerCase()).toBe('#3b82f6')
  })

  it('hover is different from accent', () => {
    const p = deriveColorPalette('#3b82f6')
    expect(p.hover).not.toBe(p.accent)
  })

  it('returns white text for dark accent color', () => {
    const p = deriveColorPalette('#111827')
    expect(p.text).toBe('#ffffff')
  })

  it('returns dark text for light accent color', () => {
    const p = deriveColorPalette('#f9fafb')
    expect(p.text).toBe('#111827')
  })
})

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
    document.head.innerHTML = ''
  })

  it('sets --color-accent CSS variable on root', () => {
    applyTheme({ accent_color: '#3b82f6', font_family: 'Inter' })
    const val = document.documentElement.style.getPropertyValue('--color-accent')
    expect(val).not.toBe('')
  })

  it('injects a Google Font link tag', () => {
    applyTheme({ accent_color: '#3b82f6', font_family: 'Inter' })
    const link = document.getElementById('google-font-theme')
    expect(link).not.toBeNull()
    expect(link.href).toContain('Inter')
  })

  it('reuses existing link tag instead of creating a new one', () => {
    applyTheme({ accent_color: '#3b82f6', font_family: 'Inter' })
    applyTheme({ accent_color: '#3b82f6', font_family: 'Roboto' })
    const links = document.querySelectorAll('#google-font-theme')
    expect(links.length).toBe(1)
    expect(links[0].href).toContain('Roboto')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run src/lib/__tests__/theme.test.js
```

Expected: FAIL — `Cannot find module '../theme'`

- [ ] **Step 3: Create src/lib/theme.js**

```js
import tinycolor from 'tinycolor2'

export function deriveColorPalette(hex) {
  const base = tinycolor(hex)
  return {
    accent: base.toHexString(),
    hover: base.clone().darken(15).toHexString(),
    light: base.clone().lighten(35).setAlpha(0.2).toRgbString(),
    text: base.isLight() ? '#111827' : '#ffffff',
  }
}

export function applyTheme({ accent_color, font_family }) {
  const palette = deriveColorPalette(accent_color ?? '#111827')
  const root = document.documentElement
  root.style.setProperty('--color-accent', palette.accent)
  root.style.setProperty('--color-accent-hover', palette.hover)
  root.style.setProperty('--color-accent-light', palette.light)
  root.style.setProperty('--color-accent-text', palette.text)

  const font = font_family ?? 'Noto Sans TC'
  root.style.setProperty('--font-body', `"${font}", sans-serif`)

  let link = document.getElementById('google-font-theme')
  if (!link) {
    link = document.createElement('link')
    link.id = 'google-font-theme'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;700&display=swap`
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run src/lib/__tests__/theme.test.js
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.js src/lib/__tests__/theme.test.js
git commit -m "feat(theme): add color derivation and CSS variable injection utilities"
```

---

## Task 3: Create SiteSettingsContext

**Files:**
- Create: `src/contexts/SiteSettingsContext.jsx`

- [ ] **Step 1: Create src/contexts/SiteSettingsContext.jsx**

```jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/theme'

const DEFAULT_SETTINGS = {
  accent_color: '#111827',
  font_family: 'Noto Sans TC',
  hidden_pages: [],
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
      applyTheme(data)
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
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/SiteSettingsContext.jsx
git commit -m "feat(theme): add SiteSettingsContext for shared settings + theme application"
```

---

## Task 4: Update App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update App.jsx**

Replace the full contents of `src/App.jsx` with:

```jsx
import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { SiteSettingsProvider, useSiteSettings } from './contexts/SiteSettingsContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import About from './pages/About'
import Services from './pages/Services'
import FAQ from './pages/FAQ'
import Saved from './pages/Saved'
import NotFound from './pages/NotFound'
const Login = lazy(() => import('./pages/Login'))
const PhotoHome = lazy(() => import('./pages/photo/PhotoHome'))
const PhotoDetail = lazy(() => import('./pages/photo/PhotoDetail'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'))
const AdminPostEdit = lazy(() => import('./pages/admin/AdminPostEdit'))
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'))
const AdminProjectEdit = lazy(() => import('./pages/admin/AdminProjectEdit'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminPhotoProjects = lazy(() => import('./pages/admin/AdminPhotoProjects'))
const AdminPhotoProjectEdit = lazy(() => import('./pages/admin/AdminPhotoProjectEdit'))
const AdminServices = lazy(() => import('./pages/admin/AdminServices'))
const AdminServiceEdit = lazy(() => import('./pages/admin/AdminServiceEdit'))
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'))
const AdminAnnouncementEdit = lazy(() => import('./pages/admin/AdminAnnouncementEdit'))
const AdminPhotos = lazy(() => import('./pages/admin/AdminPhotos'))
const AdminFAQs = lazy(() => import('./pages/admin/AdminFAQs'))
const AdminFAQEdit = lazy(() => import('./pages/admin/AdminFAQEdit'))
const AdminSubmissions = lazy(() => import('./pages/admin/AdminSubmissions'))
const AdminSubscribers = lazy(() => import('./pages/admin/AdminSubscribers'))
const Notifications = lazy(() => import('./pages/Notifications'))

function HiddenRoute({ pageKey, children }) {
  const { settings } = useSiteSettings()
  const hidden = settings.hidden_pages ?? []
  if (hidden.includes(pageKey)) return <Navigate to="/" replace />
  return children
}

function PushNavigationHandler() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = event => {
      if (event.data?.type === 'push-navigate') navigate(event.data.url)
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [navigate])
  return null
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<HiddenRoute pageKey="projects"><Projects /></HiddenRoute>} />
        <Route path="/projects/:id" element={<HiddenRoute pageKey="projects"><ProjectDetail /></HiddenRoute>} />
        <Route path="/blog" element={<HiddenRoute pageKey="blog"><Blog /></HiddenRoute>} />
        <Route path="/blog/:slug" element={<HiddenRoute pageKey="blog"><BlogPost /></HiddenRoute>} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/about" element={<HiddenRoute pageKey="about"><About /></HiddenRoute>} />
        <Route path="/services" element={<HiddenRoute pageKey="services"><Services /></HiddenRoute>} />
        <Route path="/faq" element={<HiddenRoute pageKey="faq"><FAQ /></HiddenRoute>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/login" element={<Login />} />
        <Route path="/photo" element={<HiddenRoute pageKey="photo"><PhotoHome /></HiddenRoute>} />
        <Route path="/photo/:id" element={<HiddenRoute pageKey="photo"><PhotoDetail /></HiddenRoute>} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/posts" replace />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="posts/:id" element={<AdminPostEdit />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="projects/:id" element={<AdminProjectEdit />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="photo-projects" element={<AdminPhotoProjects />} />
          <Route path="photo-projects/:id" element={<AdminPhotoProjectEdit />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="services/:id" element={<AdminServiceEdit />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="announcements/:id" element={<AdminAnnouncementEdit />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="faqs" element={<AdminFAQs />} />
          <Route path="faqs/:id" element={<AdminFAQEdit />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <SiteSettingsProvider>
          <PushNavigationHandler />
          <AppRoutes />
        </SiteSettingsProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}
```

- [ ] **Step 2: Run build to verify no errors**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in X.XXs`

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat(theme): integrate SiteSettingsProvider and HiddenRoute in App"
```

---

## Task 5: Update Nav.jsx to use SiteSettingsContext + filter hidden pages

**Files:**
- Modify: `src/components/Nav.jsx`

Desktop nav is currently hardcoded. Replace with a config-driven list filtered by `hidden_pages`.

- [ ] **Step 1: Update Nav.jsx**

Replace the import and the `Nav` function body. Only changed sections shown:

```jsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { usePushSubscription } from '../hooks/usePushSubscription'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationBadge } from './NotificationBadge'
import { SVG_MAP, FALLBACK_TABS } from './NavIconMap'

const DESKTOP_LINKS = [
  { key: 'projects', to: '/projects', label: '作品集' },
  { key: 'blog', to: '/blog', label: '部落格' },
  { key: 'saved', to: '/saved', label: '收藏' },
  { key: 'faq', to: '/faq', label: 'FAQ' },
  { key: 'about', to: '/about', label: '關於我' },
]

export default function Nav() {
  const { settings } = useSiteSettings()
  const hidden = settings.hidden_pages ?? []
  const rawTabs = settings?.nav_tabs?.length ? settings.nav_tabs : FALLBACK_TABS
  const tabs = rawTabs.filter(t => t.visible).sort((a, b) => a.order - b.order)
  const visibleDesktopLinks = DESKTOP_LINKS.filter(l => !hidden.includes(l.key))
  const location = useLocation()
  const { state, error, subscribe, unsubscribe } = usePushSubscription()
  const [hint, setHint] = useState(null)
  const { unreadCount } = useNotifications()

  function showHint(msg) {
    setHint(msg)
    setTimeout(() => setHint(null), 3000)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-12 py-5 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-wide">QA Lab</Link>
          {/* Mobile bell */}
          {(state === 'unsubscribed' || state === 'subscribed' || state === 'denied' || state === 'unsupported') && (
            <div className="relative md:hidden">
              <button
                onClick={
                  state === 'subscribed' ? unsubscribe
                  : state === 'denied' ? () => showHint('請至瀏覽器設定開啟通知權限')
                  : state === 'unsupported' ? () => showHint('需將網站加入主畫面才能訂閱通知')
                  : subscribe
                }
                title={
                  state === 'subscribed' ? '取消通知訂閱'
                  : state === 'denied' ? '請至瀏覽器設定開啟通知權限'
                  : state === 'unsupported' ? '需將網站加入主畫面才能訂閱通知'
                  : '訂閱新文章通知'
                }
                className={`transition-colors p-1 ${(state === 'denied' || state === 'unsupported') ? 'text-gray-300 cursor-default' : 'text-gray-400 hover:text-gray-700'}`}
              >
                {state === 'subscribed' ? (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                ) : state === 'denied' ? (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    <line x1="4" y1="4" x2="20" y2="20"/>
                  </svg>
                ) : (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                )}
              </button>
              {(error || hint) && (
                <div className="absolute left-0 top-8 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {error || hint}
                </div>
              )}
            </div>
          )}
          {/* Desktop nav */}
          <ul className="hidden md:flex gap-8 list-none">
            {visibleDesktopLinks.map(link => (
              <li key={link.key}>
                <Link to={link.to} className="text-sm text-gray-500 hover:text-gray-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/rss.xml" target="_blank" rel="noreferrer" title="RSS 訂閱"
              className="text-gray-400 hover:text-gray-700 transition-colors">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
              </svg>
            </a>
            {(state === 'unsubscribed' || state === 'subscribed' || state === 'denied' || state === 'unsupported') && (
              <div className="relative">
                <button
                  onClick={
                    state === 'subscribed' ? unsubscribe
                    : state === 'denied' ? () => showHint('請至瀏覽器設定開啟通知權限')
                    : state === 'unsupported' ? () => showHint('需將網站加入主畫面才能訂閱通知')
                    : subscribe
                  }
                  title={
                    state === 'subscribed' ? '取消通知訂閱'
                    : state === 'denied' ? '請至瀏覽器設定開啟通知權限'
                    : state === 'unsupported' ? '需將網站加入主畫面才能訂閱通知'
                    : '訂閱新文章通知'
                  }
                  className={`transition-colors ${(state === 'denied' || state === 'unsupported') ? 'text-gray-300 cursor-default' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  {state === 'subscribed' ? (
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                  ) : state === 'denied' ? (
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      <line x1="4" y1="4" x2="20" y2="20"/>
                    </svg>
                  ) : (
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  )}
                </button>
                {(error || hint) && (
                  <div className="absolute right-0 top-7 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {error || hint}
                  </div>
                )}
              </div>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="text-xs px-4 py-2 rounded-md transition-colors"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
              >
                聯絡我
              </a>
            )}
          </div>
        </div>
      </nav>
      {/* Mobile bottom tab bar */}
      <nav
        className="fixed left-4 right-4 md:hidden z-50 flex items-center justify-around rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-white/10"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {tabs.map(tab => {
          const active = location.pathname === tab.url || location.pathname.startsWith(tab.url + '/')
          const icon = SVG_MAP[tab.icon_key] ?? SVG_MAP.link
          const isExternal = tab.url.startsWith('http')
          const inner = (
            <span
              aria-label={tab.label}
              className={`relative flex items-center justify-center rounded-xl py-3 px-4 transition-colors ${
                active ? 'text-white bg-white/15' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {icon}
              <NotificationBadge count={tab.url === '/notifications' ? unreadCount : 0} />
            </span>
          )
          return isExternal ? (
            <a key={tab.id} href={tab.url} target="_blank" rel="noreferrer" aria-label={tab.label}>
              {inner}
            </a>
          ) : (
            <Link key={tab.id} to={tab.url} aria-current={active ? 'page' : undefined}>
              {inner}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in X.XXs`

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.jsx
git commit -m "feat(theme): Nav uses SiteSettingsContext, desktop links filtered by hidden_pages"
```

---

## Task 6: Add 外觀設定 section to AdminSettings.jsx

**Files:**
- Modify: `src/pages/admin/AdminSettings.jsx`

- [ ] **Step 1: Add imports and constants at the top of AdminSettings.jsx**

After the existing imports, add:

```jsx
import { applyTheme } from '../../lib/theme'
import { useSiteSettings } from '../../contexts/SiteSettingsContext'

const FONT_OPTIONS = [
  { value: 'Noto Sans TC', label: 'Noto Sans TC（無襯線）' },
  { value: 'Noto Serif TC', label: 'Noto Serif TC（有襯線）' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Merriweather', label: 'Merriweather（有襯線）' },
  { value: 'Playfair Display', label: 'Playfair Display（有襯線）' },
  { value: 'Source Code Pro', label: 'Source Code Pro（等寬）' },
]

const PAGE_OPTIONS = [
  { key: 'blog', label: '部落格' },
  { key: 'projects', label: '作品集' },
  { key: 'services', label: '服務' },
  { key: 'faq', label: 'FAQ' },
  { key: 'photo', label: '攝影' },
  { key: 'about', label: '關於我' },
]
```

- [ ] **Step 2: Add theme state and refresh to AdminSettings component**

In `AdminSettings`, add inside the component:

```jsx
const { refresh: refreshSettings } = useSiteSettings()
```

And extend the initial `form` state to include the three new fields. Find the existing `useState` for `form` and add:

```jsx
const [form, setForm] = useState({
  email: '', github_url: '', linkedin_url: '', avatar_url: '',
  photo_avatar_url: '', seo_keywords: '', seo_description: '',
  seo_photo_keywords: '', seo_photo_description: '',
  accent_color: '#111827', font_family: 'Noto Sans TC', hidden_pages: [],
})
```

- [ ] **Step 3: Update handleSubmit to include new fields**

In the existing `handleSubmit` function, add the three new fields to the `update` call:

```jsx
const { error: saveError } = await supabase.from('settings').update({
  email: form.email,
  github_url: form.github_url,
  linkedin_url: form.linkedin_url,
  avatar_url: form.avatar_url,
  photo_avatar_url: form.photo_avatar_url,
  seo_keywords: form.seo_keywords,
  seo_description: form.seo_description,
  seo_photo_keywords: form.seo_photo_keywords,
  seo_photo_description: form.seo_photo_description,
  accent_color: form.accent_color,
  font_family: form.font_family,
  hidden_pages: form.hidden_pages,
}).eq('id', 1)
if (!saveError) {
  await refreshSettings()
  setSuccess(true)
}
```

- [ ] **Step 4: Add 外觀設定 section to the JSX**

Find the closing `</form>` of the main settings form and add the 外觀設定 section before it (inside the form, after the existing SEO fields):

```jsx
{/* 外觀設定 */}
<div className="mt-10 pt-8 border-t border-gray-100">
  <h2 className="text-sm font-semibold text-gray-900 mb-6">外觀設定</h2>

  {/* Accent color */}
  <div className="mb-6">
    <label className="text-xs font-medium text-gray-700 block mb-2">品牌主色</label>
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={form.accent_color ?? '#111827'}
        onChange={e => {
          const val = e.target.value
          setForm(f => ({ ...f, accent_color: val }))
          applyTheme({ accent_color: val, font_family: form.font_family })
        }}
        className="w-10 h-10 rounded cursor-pointer border border-gray-200 p-0.5"
      />
      <span className="text-sm text-gray-500 font-mono">{form.accent_color ?? '#111827'}</span>
    </div>
  </div>

  {/* Font family */}
  <div className="mb-6">
    <label className="text-xs font-medium text-gray-700 block mb-2">字型</label>
    <select
      value={form.font_family ?? 'Noto Sans TC'}
      onChange={e => {
        const val = e.target.value
        setForm(f => ({ ...f, font_family: val }))
        applyTheme({ accent_color: form.accent_color, font_family: val })
      }}
      className="text-sm border border-gray-200 rounded-md px-3 py-2 w-64"
    >
      {FONT_OPTIONS.map(f => (
        <option key={f.value} value={f.value}>{f.label}</option>
      ))}
    </select>
  </div>

  {/* Page visibility */}
  <div>
    <label className="text-xs font-medium text-gray-700 block mb-3">頁面顯示</label>
    <div className="flex flex-col gap-1">
      {PAGE_OPTIONS.map(page => {
        const isVisible = !(form.hidden_pages ?? []).includes(page.key)
        return (
          <label key={page.key} className="flex items-center gap-3 py-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={e => {
                const hidden = form.hidden_pages ?? []
                const next = e.target.checked
                  ? hidden.filter(k => k !== page.key)
                  : [...hidden, page.key]
                setForm(f => ({ ...f, hidden_pages: next }))
              }}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">{page.label}</span>
            {!isVisible && <span className="text-xs text-gray-400">（隱藏）</span>}
          </label>
        )
      })}
    </div>
  </div>
</div>
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in X.XXs`

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminSettings.jsx
git commit -m "feat(theme): add accent color, font, and page visibility controls to AdminSettings"
```

---

## Task 7: Replace hardcoded accent colors in BlogPost + ArticleToolbar

**Files:**
- Modify: `src/pages/BlogPost.jsx` (lines with `bg-gray-900` for progress bar)
- Modify: `src/components/ArticleToolbar.jsx` (barColor)

- [ ] **Step 1: Update BlogPost.jsx progress bars**

Find both instances of:
```jsx
<div className="fixed top-0 left-0 h-[3px] bg-gray-900 z-50" style={{ width: `${progress}%` }} />
```

Replace both with:
```jsx
<div className="fixed top-0 left-0 h-[3px] z-50" style={{ width: `${progress}%`, backgroundColor: 'var(--color-accent)' }} />
```

(There are two instances — one in the loading state render and one in the main render. Replace both.)

- [ ] **Step 2: Update ArticleToolbar.jsx barColor**

Find:
```js
const barColor = dark ? '#9ca3af' : '#111827'
```

Replace with:
```js
const barColor = dark ? '#9ca3af' : 'var(--color-accent)'
```

- [ ] **Step 3: Run all tests**

```bash
npm run test:run
```

Expected: all existing tests pass

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in X.XXs`

- [ ] **Step 5: Commit**

```bash
git add src/pages/BlogPost.jsx src/components/ArticleToolbar.jsx
git commit -m "feat(theme): progress bars use --color-accent CSS variable"
```

---

## Task 8: Push + smoke test

- [ ] **Step 1: Push to remote**

```bash
git push
```

- [ ] **Step 2: Manual smoke test**

1. Open the deployed site, open DevTools → Elements → `<html>` style attribute
2. Confirm `--color-accent` is set (default `#111827`)
3. Go to `/admin/settings` → 外觀設定
4. Change accent color to `#3b82f6` — verify CTA button and progress bar turn blue immediately
5. Change font to `Inter` — verify body font changes immediately
6. Toggle `FAQ` off — verify FAQ disappears from desktop nav
7. Save → refresh page — verify all settings persisted
8. Try navigating to `/faq` directly — confirm redirect to `/`
