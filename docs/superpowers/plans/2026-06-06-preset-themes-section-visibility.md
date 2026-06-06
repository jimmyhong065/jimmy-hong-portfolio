# Preset Themes + Section Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-click preset themes and Home section visibility controls to the admin panel so non-technical clients can customize the site without code changes.

**Architecture:** Five hardcoded preset objects live in `src/lib/presets.js`. `applyTheme()` is extended to accept `bg_color` and sets `--color-bg` + `--color-text-primary` CSS variables. `AdminSettings` shows preset cards at the top of 外觀設定, plus a new bg picker and `hidden_sections` checkboxes. `Home.jsx` reads `hidden_sections` from `SiteSettingsContext` to conditionally render four sections.

**Tech Stack:** React, tinycolor2, Supabase, Vitest/Testing Library

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Create | `src/lib/presets.js` | `PRESETS` array — 5 preset definitions |
| Modify | `src/lib/theme.js` | `applyTheme` accepts `bg_color`, sets `--color-bg`, `--color-text-primary`, `body.style.backgroundColor` |
| Modify | `src/lib/__tests__/theme.test.js` | 3 new tests for bg_color behaviour |
| Modify | `src/contexts/SiteSettingsContext.jsx` | `DEFAULT_SETTINGS` gets `bg_color`, `hidden_sections`; `applyTheme` call passes `bg_color` |
| Modify | `src/pages/Home.jsx` | Import `useSiteSettings`, wrap 4 sections in `hidden_sections` guards |
| Modify | `src/pages/admin/AdminSettings.jsx` | Preset cards, bg_color picker, `hidden_sections` checkboxes, updated save payload |

---

## Task 1: Supabase Migration + presets.js

**Files:**
- Create: `src/lib/presets.js`
- (User runs SQL migration manually — no code file)

- [ ] **Step 1: Run migration in Supabase dashboard SQL Editor**

```sql
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS bg_color        text    DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS hidden_sections text[]  DEFAULT '{}';
```

Expected: no error, command completes.

- [ ] **Step 2: Create `src/lib/presets.js`**

```js
export const PRESETS = [
  { id: 'minimal', name: 'Minimal', accent_color: '#111827', font_family: 'Noto Sans TC',    bg_color: '#ffffff' },
  { id: 'ocean',   name: 'Ocean',   accent_color: '#2563eb', font_family: 'Inter',            bg_color: '#ffffff' },
  { id: 'bold',    name: 'Bold',    accent_color: '#7c3aed', font_family: 'Playfair Display', bg_color: '#ffffff' },
  { id: 'warm',    name: 'Warm',    accent_color: '#d97706', font_family: 'Lato',             bg_color: '#fafaf9' },
  { id: 'dark',    name: 'Dark',    accent_color: '#38bdf8', font_family: 'Inter',            bg_color: '#0f172a' },
]
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/presets.js
git commit -m "feat(theme): add preset theme definitions"
```

---

## Task 2: Extend applyTheme for bg_color

**Files:**
- Modify: `src/lib/theme.js`
- Modify: `src/lib/__tests__/theme.test.js`

- [ ] **Step 1: Write failing tests first**

Open `src/lib/__tests__/theme.test.js`. Add these 3 tests inside the existing `describe('applyTheme', ...)` block (after the existing 3 tests):

```js
  it('sets --color-bg CSS variable when bg_color provided', () => {
    applyTheme({ accent_color: '#3b82f6', font_family: 'Inter', bg_color: '#0f172a' })
    const val = document.documentElement.style.getPropertyValue('--color-bg')
    expect(val).toBe('#0f172a')
  })

  it('sets --color-text-primary to light color for dark bg', () => {
    applyTheme({ accent_color: '#38bdf8', font_family: 'Inter', bg_color: '#0f172a' })
    const val = document.documentElement.style.getPropertyValue('--color-text-primary')
    expect(val).toBe('#f1f5f9')
  })

  it('sets --color-text-primary to dark color for light bg', () => {
    applyTheme({ accent_color: '#111827', font_family: 'Noto Sans TC', bg_color: '#ffffff' })
    const val = document.documentElement.style.getPropertyValue('--color-text-primary')
    expect(val).toBe('#111827')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/lib/__tests__/theme.test.js
```

Expected: 3 new tests FAIL with something like "expected '' to be '#0f172a'"

- [ ] **Step 3: Update `src/lib/theme.js`**

Replace the entire file with:

```js
import tinycolor from 'tinycolor2'

export function deriveColorPalette(hex) {
  const base = tinycolor(hex)
  if (!base.isValid()) return deriveColorPalette('#111827')
  return {
    accent: base.toHexString(),
    hover: base.clone().darken(15).toHexString(),
    light: base.clone().lighten(35).setAlpha(0.2).toRgbString(),
    text: base.isLight() ? '#111827' : '#ffffff',
  }
}

export function applyTheme({ accent_color, font_family, bg_color }) {
  if (typeof document === 'undefined') return
  const palette = deriveColorPalette(accent_color ?? '#111827')
  const root = document.documentElement
  root.style.setProperty('--color-accent', palette.accent)
  root.style.setProperty('--color-accent-hover', palette.hover)
  root.style.setProperty('--color-accent-light', palette.light)
  root.style.setProperty('--color-accent-text', palette.text)

  const bg = bg_color ?? '#ffffff'
  root.style.setProperty('--color-bg', bg)
  const textPrimary = tinycolor(bg).isLight() ? '#111827' : '#f1f5f9'
  root.style.setProperty('--color-text-primary', textPrimary)
  document.body.style.backgroundColor = bg

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
npm run test:run -- src/lib/__tests__/theme.test.js
```

Expected: 10 tests PASS (4 deriveColorPalette + 3 existing applyTheme + 3 new applyTheme)

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.js src/lib/__tests__/theme.test.js
git commit -m "feat(theme): applyTheme handles bg_color, sets --color-bg and --color-text-primary"
```

---

## Task 3: Update SiteSettingsContext

**Files:**
- Modify: `src/contexts/SiteSettingsContext.jsx`

- [ ] **Step 1: Update DEFAULT_SETTINGS and applyTheme call**

Replace the entire file with:

```jsx
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
```

- [ ] **Step 2: Run full test suite to verify no regressions**

```bash
npm run test:run 2>&1 | grep -E "Test Files|Tests "
```

Expected: same pass/fail count as before (11 failing pre-existing, 169+ passing)

- [ ] **Step 3: Commit**

```bash
git add src/contexts/SiteSettingsContext.jsx
git commit -m "feat(theme): SiteSettingsContext passes bg_color to applyTheme, adds hidden_sections default"
```

---

## Task 4: Home.jsx Section Visibility

**Files:**
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Switch Home.jsx to useSiteSettings (replaces useSettings — avoids double fetch)**

`SiteSettingsContext` already carries all settings fields including SEO, avatars, etc. Switching eliminates one redundant Supabase fetch.

In `src/pages/Home.jsx`:

Replace:
```js
import { useSettings } from '../hooks/useSettings'
```

With:
```js
import { useSiteSettings } from '../contexts/SiteSettingsContext'
```

Replace:
```js
const { settings } = useSettings()
```

With:
```js
const { settings } = useSiteSettings()
const hiddenSections = settings.hidden_sections ?? []
```

- [ ] **Step 2: Wrap Dual Identity section**

Find this comment in Home.jsx:
```jsx
{/* ── Dual identity — white ── */}
<section className="max-w-5xl mx-auto px-4 md:px-12 py-16">
```

Replace with:
```jsx
{/* ── Dual identity — white ── */}
{!hiddenSections.includes('dual_identity') && (
<section className="max-w-5xl mx-auto px-4 md:px-12 py-16">
```

And find its closing tag `</section>` immediately followed by the Featured projects comment, and change it to:
```jsx
</section>
)}
```

- [ ] **Step 3: Wrap Featured Projects section**

Find:
```jsx
{/* ── Featured projects — slate-50 ── */}
<div className="bg-slate-50">
```

Replace with:
```jsx
{/* ── Featured projects — slate-50 ── */}
{!hiddenSections.includes('featured_projects') && (
<div className="bg-slate-50">
```

And find its closing `</div>` (the one closing `bg-slate-50`) and change to:
```jsx
</div>
)}
```

- [ ] **Step 4: Wrap Recent Posts section**

Find:
```jsx
{/* ── Recent posts — white ── */}
<section className="max-w-5xl mx-auto px-4 md:px-12 py-16">
```

Replace with:
```jsx
{/* ── Recent posts — white ── */}
{!hiddenSections.includes('recent_posts') && (
<section className="max-w-5xl mx-auto px-4 md:px-12 py-16">
```

And find its closing `</section>` and change to:
```jsx
</section>
)}
```

- [ ] **Step 5: Wrap Services section**

Find:
```jsx
{/* ── Services — gray-900 dark ── */}
<div className="bg-gray-900">
```

Replace with:
```jsx
{/* ── Services — gray-900 dark ── */}
{!hiddenSections.includes('services') && (
<div className="bg-gray-900">
```

And find its closing `</div>` (the one closing `bg-gray-900`) and change to:
```jsx
</div>
)}
```

- [ ] **Step 6: Verify build passes**

```bash
npm run build 2>&1 | tail -3
```

Expected: `✓ built in X.XXs`

- [ ] **Step 7: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat(theme): Home sections conditionally rendered from hidden_sections setting"
```

---

## Task 5: AdminSettings — Presets, bg_color, hidden_sections

**Files:**
- Modify: `src/pages/admin/AdminSettings.jsx`

- [ ] **Step 1: Add imports and constants**

At the top of `src/pages/admin/AdminSettings.jsx`, add the `PRESETS` import after the existing imports:

```js
import { PRESETS } from '../../lib/presets'
```

After the existing `PAGE_OPTIONS` constant (around line 27), add:

```js
const SECTION_OPTIONS = [
  { key: 'dual_identity',    label: '雙身份介紹' },
  { key: 'featured_projects', label: '精選作品' },
  { key: 'recent_posts',     label: '最新文章' },
  { key: 'services',         label: '服務區塊' },
]
```

- [ ] **Step 2: Add bg_color and hidden_sections to form state**

In the `useState` initializer (around line 53), extend the form object:

```js
const [form, setForm] = useState({
  email: '', github_url: '', linkedin_url: '', avatar_url: '',
  photo_avatar_url: '', seo_keywords: '', seo_description: '',
  seo_photo_keywords: '', seo_photo_description: '',
  accent_color: '#111827', font_family: 'Noto Sans TC', hidden_pages: [],
  bg_color: '#ffffff', hidden_sections: [],
})
```

- [ ] **Step 3: Add bg_color and hidden_sections to handleSubmit**

In `handleSubmit`, extend the Supabase update object (currently ends with `hidden_pages: form.hidden_pages`):

```js
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
  bg_color: form.bg_color,
  hidden_sections: form.hidden_sections,
}).eq('id', 1)
```

- [ ] **Step 4: Fix existing applyTheme calls to pass bg_color**

There are two `applyTheme` calls inside `AdminSettings` (the accent_color onChange and the font_family onChange). Update both to include `bg_color`:

Accent color onChange (currently `applyTheme({ accent_color: val, font_family: form.font_family })`):
```js
applyTheme({ accent_color: val, font_family: form.font_family, bg_color: form.bg_color })
```

Font onChange (currently `applyTheme({ accent_color: form.accent_color, font_family: val })`):
```js
applyTheme({ accent_color: form.accent_color, font_family: val, bg_color: form.bg_color })
```

- [ ] **Step 5: Add preset cards UI**

In `AdminSettings.jsx`, find the 外觀設定 `<h2>` line:
```jsx
<h2 className="text-sm font-semibold text-gray-900 mb-6">外觀設定</h2>
```

Insert the preset cards block immediately after it:

```jsx
{/* Preset 快速套用 */}
<div className="mb-8">
  <label className="text-xs font-medium text-gray-700 block mb-3">Preset 快速套用</label>
  <div className="flex gap-3 overflow-x-auto pb-2">
    {PRESETS.map(preset => (
      <button
        key={preset.id}
        type="button"
        onClick={() => {
          setForm(f => ({ ...f, accent_color: preset.accent_color, font_family: preset.font_family, bg_color: preset.bg_color }))
          applyTheme({ accent_color: preset.accent_color, font_family: preset.font_family, bg_color: preset.bg_color })
        }}
        className="flex-shrink-0 border border-gray-200 rounded-xl px-4 py-3 text-left hover:border-gray-900 transition-colors min-w-[100px]"
      >
        <div className="w-6 h-6 rounded-full mb-2 border border-gray-200" style={{ backgroundColor: preset.accent_color }} />
        <p className="text-xs font-semibold text-gray-900">{preset.name}</p>
        <p className="text-xs text-gray-400 truncate">{preset.font_family}</p>
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 6: Add bg_color picker**

Find the existing accent color block that ends with:
```jsx
          </div>
          </div>

          {/* Font family */}
```

Insert the bg_color picker between accent color and font family:

```jsx
          {/* Background color */}
          <div className="mb-6">
            <label className="text-xs font-medium text-gray-700 block mb-2">背景色</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.bg_color ?? '#ffffff'}
                onChange={e => {
                  const val = e.target.value
                  setForm(f => ({ ...f, bg_color: val }))
                  applyTheme({ accent_color: form.accent_color, font_family: form.font_family, bg_color: val })
                }}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200 p-0.5"
              />
              <span className="text-sm text-gray-500 font-mono">{form.bg_color ?? '#ffffff'}</span>
            </div>
          </div>
```

- [ ] **Step 7: Add hidden_sections checkboxes**

Find the closing of the page visibility block:
```jsx
          </div>
        </div>

        {success && ...
```

Insert the hidden_sections block between the page visibility `</div></div>` and the success message:

```jsx
          {/* Home section visibility */}
          <div className="mt-6">
            <label className="text-xs font-medium text-gray-700 block mb-3">首頁 Section 顯示</label>
            <div className="flex flex-col gap-1">
              {SECTION_OPTIONS.map(section => {
                const isVisible = !(form.hidden_sections ?? []).includes(section.key)
                return (
                  <label key={section.key} className="flex items-center gap-3 py-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={e => {
                        const hidden = form.hidden_sections ?? []
                        const next = e.target.checked
                          ? hidden.filter(k => k !== section.key)
                          : [...hidden, section.key]
                        setForm(f => ({ ...f, hidden_sections: next }))
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{section.label}</span>
                    {!isVisible && <span className="text-xs text-gray-400">（隱藏）</span>}
                  </label>
                )
              })}
            </div>
          </div>
```

- [ ] **Step 8: Verify build passes**

```bash
npm run build 2>&1 | tail -3
```

Expected: `✓ built in X.XXs`

- [ ] **Step 9: Run full test suite**

```bash
npm run test:run 2>&1 | grep -E "Test Files|Tests "
```

Expected: same or better pass count (≥169 passing, ≤11 failing)

- [ ] **Step 10: Commit**

```bash
git add src/pages/admin/AdminSettings.jsx
git commit -m "feat(theme): add preset cards, bg_color picker, and hidden_sections checkboxes to AdminSettings"
```

---

## Final: Push

- [ ] **Push to remote**

```bash
git push
```

Then manually smoke test in `/admin/settings`:
1. Click a preset card → accent + font + bg change instantly
2. Click "Dark" → page background turns dark blue
3. Uncheck 服務區塊 → save → go to `/` → Services section gone
4. Re-check 服務區塊 → save → section reappears
