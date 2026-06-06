# Brand & Content Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 9 new admin-configurable fields (brand name, CTA text, card style, heading font, hero copy) so each client deployment can customize brand identity and homepage content without touching code.

**Architecture:** New DB columns feed into `SiteSettingsContext` → `DEFAULT_SETTINGS` → all consuming components. `heading_font` goes through `applyTheme()` to set a `--font-heading` CSS var, which a global CSS rule picks up. `card_style` is read per-card via `useSiteSettings()`. Hero copy replaces hardcoded strings in `Home.jsx`.

**Tech Stack:** React, Vite, Supabase, Tailwind CSS, tinycolor2, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/theme.js` | Modify | Add `heading_font` param, set `--font-heading`, inject `google-font-heading` link |
| `src/lib/__tests__/theme.test.js` | Modify | 3 new tests for heading_font |
| `src/styles/index.css` | Modify | Add `h1,h2,h3,h4 { font-family: var(--font-heading, var(--font-body)); }` |
| `src/contexts/SiteSettingsContext.jsx` | Modify | Add 9 fields to DEFAULT_SETTINGS; pass `heading_font` to `applyTheme` |
| `src/components/Nav.jsx` | Modify | `brand_name` + `cta_text` from settings |
| `src/components/__tests__/Nav.test.jsx` | Modify | Assert brand_name + cta_text rendered |
| `src/components/Footer.jsx` | Modify | `brand_name` from settings; filter links by `hidden_pages` |
| `src/components/__tests__/Footer.test.jsx` | Create | Test brand_name + hidden link behavior |
| `src/components/BlogCard.jsx` | Modify | `card_style` from settings drives decoration classes |
| `src/components/__tests__/BlogCard.test.jsx` | Create | Test card class variants |
| `src/components/ProjectCard.jsx` | Modify | `card_style` from settings drives decoration classes |
| `src/components/__tests__/ProjectCard.test.jsx` | Create | Test card class variants |
| `src/pages/Home.jsx` | Modify | Replace all hardcoded hero content with settings fields |
| `src/pages/admin/AdminSettings.jsx` | Modify | New 品牌與文案 section + heading_font + card_style fields |

---

### Task 1: DB Migration — 9 new columns

**Files:**
- Run in Supabase SQL Editor (no local file)

- [ ] **Step 1: Run migration in Supabase SQL Editor**

```sql
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS brand_name        text     DEFAULT 'QA Lab',
  ADD COLUMN IF NOT EXISTS cta_text          text     DEFAULT '聯絡我',
  ADD COLUMN IF NOT EXISTS card_style        text     DEFAULT 'shadowed',
  ADD COLUMN IF NOT EXISTS heading_font      text     DEFAULT 'Noto Sans TC',
  ADD COLUMN IF NOT EXISTS hero_name         text     DEFAULT 'Jimmy Hong',
  ADD COLUMN IF NOT EXISTS hero_subtitle     text     DEFAULT 'QA Engineer / 品質架構師',
  ADD COLUMN IF NOT EXISTS hero_tagline      text     DEFAULT '打造讓團隊信任的 QA 系統',
  ADD COLUMN IF NOT EXISTS hero_description  text     DEFAULT '專注測試流程設計與品質架構。
從流程標準化到自動化導入，
讓品質成為開發文化，而不是最後一道關卡。',
  ADD COLUMN IF NOT EXISTS hero_skills       text[]   DEFAULT '{"測試策略","CI/CD 整合","自動化框架","QA 流程設計"}';
```

- [ ] **Step 2: Verify columns exist**

```sql
SELECT brand_name, cta_text, card_style, heading_font, hero_name, hero_subtitle, hero_tagline, hero_skills
FROM settings WHERE id = 1;
```

Expected: one row with default values (or empty if previously set).

- [ ] **Step 3: Commit a note**

```bash
git commit --allow-empty -m "feat(db): add 9 brand/content columns to settings table"
```

---

### Task 2: theme.js — heading_font support

**Files:**
- Modify: `src/lib/theme.js`
- Modify: `src/lib/__tests__/theme.test.js`

- [ ] **Step 1: Write 3 failing tests**

Open `src/lib/__tests__/theme.test.js`. Append at the end of the `describe('applyTheme', ...)` block (before the closing `}`):

```js
  it('sets --font-heading CSS variable when heading_font provided', () => {
    applyTheme({ accent_color: '#111827', font_family: 'Inter', heading_font: 'Playfair Display' })
    const val = document.documentElement.style.getPropertyValue('--font-heading')
    expect(val).toContain('Playfair Display')
  })

  it('injects a google-font-heading link tag', () => {
    applyTheme({ accent_color: '#111827', font_family: 'Inter', heading_font: 'Playfair Display' })
    const link = document.getElementById('google-font-heading')
    expect(link).not.toBeNull()
    expect(link.href).toContain('Playfair+Display')
  })

  it('reuses google-font-heading link tag on second call', () => {
    applyTheme({ accent_color: '#111827', font_family: 'Inter', heading_font: 'Playfair Display' })
    applyTheme({ accent_color: '#111827', font_family: 'Inter', heading_font: 'Merriweather' })
    const links = document.querySelectorAll('#google-font-heading')
    expect(links.length).toBe(1)
    expect(links[0].href).toContain('Merriweather')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/theme.test.js
```

Expected: 3 new tests FAIL with something like "expected '' not to be ''"

- [ ] **Step 3: Implement heading_font in theme.js**

Replace the entire `applyTheme` function in `src/lib/theme.js`:

```js
export function applyTheme({ accent_color, font_family, bg_color, heading_font }) {
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

  const hFont = heading_font ?? font
  root.style.setProperty('--font-heading', `"${hFont}", sans-serif`)

  let hLink = document.getElementById('google-font-heading')
  if (!hLink) {
    hLink = document.createElement('link')
    hLink.id = 'google-font-heading'
    hLink.rel = 'stylesheet'
    document.head.appendChild(hLink)
  }
  hLink.href = `https://fonts.googleapis.com/css2?family=${hFont.replace(/ /g, '+')}:wght@400;500;700&display=swap`
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
npx vitest run src/lib/__tests__/theme.test.js
```

Expected: all 11 tests PASS (8 existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.js src/lib/__tests__/theme.test.js
git commit -m "feat(theme): add heading_font param and --font-heading CSS var"
```

---

### Task 3: index.css — heading font rule

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: Add h1–h4 rule**

Open `src/styles/index.css`. After the `@tailwind utilities;` line (line 3), add:

```css
h1, h2, h3, h4 {
  font-family: var(--font-heading, var(--font-body));
}
```

The file should look like:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

h1, h2, h3, h4 {
  font-family: var(--font-heading, var(--font-body));
}

/* Article font size — applied to <article> element */
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/index.css
git commit -m "feat(css): apply --font-heading to h1–h4 elements"
```

---

### Task 4: SiteSettingsContext — 9 new fields + heading_font in applyTheme

**Files:**
- Modify: `src/contexts/SiteSettingsContext.jsx`

- [ ] **Step 1: Update DEFAULT_SETTINGS and applyTheme call**

Replace `src/contexts/SiteSettingsContext.jsx` entirely with:

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
```

- [ ] **Step 2: Run full test suite to ensure nothing broke**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/contexts/SiteSettingsContext.jsx
git commit -m "feat(context): add 9 brand/hero fields to DEFAULT_SETTINGS; pass heading_font to applyTheme"
```

---

### Task 5: Nav.jsx — brand_name + cta_text

**Files:**
- Modify: `src/components/Nav.jsx`
- Modify: `src/components/__tests__/Nav.test.jsx`

- [ ] **Step 1: Add brand_name + cta_text tests to Nav.test.jsx**

Open `src/components/__tests__/Nav.test.jsx`. The mock at the top currently returns `{ settings: { email: 'test@example.com', hidden_pages: [] } }`. Update it to include the new fields, and add 2 new tests.

Update the mock:

```js
vi.mock('../../contexts/SiteSettingsContext', () => ({
  useSiteSettings: () => ({
    settings: {
      email: 'test@example.com',
      hidden_pages: [],
      brand_name: 'Test Brand',
      cta_text: '立即聯繫',
    },
  }),
}))
```

Add two tests:

```js
it('renders brand_name from settings', () => {
  render(<MemoryRouter><Nav /></MemoryRouter>)
  expect(screen.getByText('Test Brand')).toBeInTheDocument()
})

it('renders cta_text from settings', () => {
  render(<MemoryRouter><Nav /></MemoryRouter>)
  expect(screen.getByText('立即聯繫')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run Nav tests to verify new tests fail**

```bash
npx vitest run src/components/__tests__/Nav.test.jsx
```

Expected: 2 new tests FAIL (brand_name still hardcoded as "QA Lab", cta_text hardcoded as "聯絡我").

- [ ] **Step 3: Update Nav.jsx**

In `src/components/Nav.jsx`:

Line 37 — replace the brand link content:
```jsx
// Before:
<Link to="/" className="text-sm font-semibold tracking-wide">QA Lab</Link>

// After:
<Link to="/" className="text-sm font-semibold tracking-wide">{settings.brand_name ?? 'QA Lab'}</Link>
```

Line 145 — replace the CTA text:
```jsx
// Before:
<a href={`mailto:${settings.email}`} className="text-xs px-4 py-2 rounded-md transition-colors" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}>
  聯絡我
</a>

// After:
<a href={`mailto:${settings.email}`} className="text-xs px-4 py-2 rounded-md transition-colors" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}>
  {settings.cta_text ?? '聯絡我'}
</a>
```

- [ ] **Step 4: Run Nav tests to verify all pass**

```bash
npx vitest run src/components/__tests__/Nav.test.jsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.jsx src/components/__tests__/Nav.test.jsx
git commit -m "feat(nav): brand_name and cta_text from settings"
```

---

### Task 6: Footer.jsx — brand_name + hidden_pages filter

**Files:**
- Modify: `src/components/Footer.jsx`
- Create: `src/components/__tests__/Footer.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/Footer.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'
import Footer from '../Footer'

vi.mock('../../contexts/SiteSettingsContext', () => ({
  useSiteSettings: () => ({
    settings: {
      brand_name: 'Acme QA',
      hidden_pages: ['photo'],
    },
  }),
}))

describe('Footer', () => {
  it('renders brand_name from settings', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getAllByText('Acme QA').length).toBeGreaterThan(0)
  })

  it('hides link when page in hidden_pages', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.queryByText('攝影')).toBeNull()
  })

  it('shows link when page not in hidden_pages', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getByText('部落格')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/Footer.test.jsx
```

Expected: all 3 tests FAIL (Footer doesn't import useSiteSettings yet).

- [ ] **Step 3: Rewrite Footer.jsx**

Replace `src/components/Footer.jsx` entirely:

```jsx
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'

const FOOTER_LINKS = [
  { key: 'blog',     to: '/blog',     label: '部落格' },
  { key: 'photo',    to: '/photo',    label: '攝影' },
  { key: 'services', to: '/services', label: '合作方式' },
  { key: 'about',    to: '/about',    label: '關於我' },
]

export default function Footer() {
  const { settings } = useSiteSettings()
  const hidden = settings.hidden_pages ?? []
  const brandName = settings.brand_name ?? 'QA Lab'
  const visibleLinks = FOOTER_LINKS.filter(l => !hidden.includes(l.key))
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-100 pt-8 pb-24 md:pb-10 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Desktop: two-column */}
        <div className="hidden md:flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">{brandName}</p>
            <div className="flex gap-4">
              {visibleLinks.map(l => (
                <Link key={l.key} to={l.to} className="text-xs text-gray-400 hover:text-gray-700">{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">© {year} {brandName}</p>
            <a href="/rss.xml" className="text-xs text-gray-300 hover:text-gray-500 mt-0.5 block">RSS 訂閱</a>
          </div>
        </div>
        {/* Mobile: stacked */}
        <div className="md:hidden flex flex-col gap-4">
          <p className="text-xs font-medium text-gray-700">{brandName}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {visibleLinks.map(l => (
              <Link key={l.key} to={l.to} className="text-xs text-gray-400 hover:text-gray-700">{l.label}</Link>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">© {year} {brandName}</p>
            <a href="/rss.xml" className="text-xs text-gray-300 hover:text-gray-500">RSS 訂閱</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Run Footer tests to verify all pass**

```bash
npx vitest run src/components/__tests__/Footer.test.jsx
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.jsx src/components/__tests__/Footer.test.jsx
git commit -m "feat(footer): brand_name from settings; filter links by hidden_pages"
```

---

### Task 7: BlogCard.jsx — card_style decoration

**Files:**
- Modify: `src/components/BlogCard.jsx`
- Create: `src/components/__tests__/BlogCard.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/BlogCard.test.jsx`:

```jsx
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'
import BlogCard from '../BlogCard'

const POST = { slug: 'test', title: 'Test Post', published_at: '2024-01-01', tags: [], excerpt: '' }

function makeSettings(cardStyle) {
  return { settings: { card_style: cardStyle } }
}

vi.mock('../../contexts/SiteSettingsContext', () => ({
  useSiteSettings: vi.fn(),
}))

import { useSiteSettings } from '../../contexts/SiteSettingsContext'

describe('BlogCard card_style', () => {
  it('applies shadow classes for shadowed style', () => {
    useSiteSettings.mockReturnValue(makeSettings('shadowed'))
    const { container } = render(<MemoryRouter><BlogCard post={POST} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('shadow-sm')
  })

  it('applies border classes for bordered style', () => {
    useSiteSettings.mockReturnValue(makeSettings('bordered'))
    const { container } = render(<MemoryRouter><BlogCard post={POST} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('border-gray-200')
    expect(container.firstChild.className).not.toContain('shadow-sm')
  })

  it('applies no shadow or border for minimal style', () => {
    useSiteSettings.mockReturnValue(makeSettings('minimal'))
    const { container } = render(<MemoryRouter><BlogCard post={POST} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('shadow-none')
    expect(container.firstChild.className).not.toContain('shadow-sm')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/BlogCard.test.jsx
```

Expected: all 3 tests FAIL (BlogCard doesn't call useSiteSettings yet).

- [ ] **Step 3: Update BlogCard.jsx**

Replace `src/components/BlogCard.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'

export default function BlogCard({ post, isRead = false }) {
  const { settings } = useSiteSettings()
  const date = post.published_at ? post.published_at.slice(0, 10) : ''
  const tags = (post.tags ?? []).slice(0, 3)

  const decorClass =
    settings.card_style === 'bordered' ? 'border border-gray-200 shadow-none hover:border-gray-400' :
    settings.card_style === 'minimal'  ? 'border border-transparent shadow-none' :
    'border border-gray-100 shadow-sm hover:shadow-md'

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`block rounded-2xl ${decorClass} p-4 mb-3 transition-shadow relative${isRead ? ' opacity-60' : ''}`}
    >
      {isRead && (
        <span className="absolute top-3 right-3 text-[10px] text-gray-400">✓</span>
      )}
      {tags.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{post.title}</p>
      {post.excerpt && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
      )}
      {date && <p className="text-xs text-gray-400">{date}</p>}
    </Link>
  )
}
```

- [ ] **Step 4: Run BlogCard tests to verify all pass**

```bash
npx vitest run src/components/__tests__/BlogCard.test.jsx
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/BlogCard.jsx src/components/__tests__/BlogCard.test.jsx
git commit -m "feat(blog-card): card_style decoration from settings"
```

---

### Task 8: ProjectCard.jsx — card_style decoration

**Files:**
- Modify: `src/components/ProjectCard.jsx`
- Create: `src/components/__tests__/ProjectCard.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/ProjectCard.test.jsx`:

```jsx
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'
import ProjectCard from '../ProjectCard'

const PROJECT = { id: '1', title: 'Test', description: 'Desc', tags: [], cover_url: null }

function makeSettings(cardStyle) {
  return { settings: { card_style: cardStyle } }
}

vi.mock('../../contexts/SiteSettingsContext', () => ({
  useSiteSettings: vi.fn(),
}))

import { useSiteSettings } from '../../contexts/SiteSettingsContext'

describe('ProjectCard card_style', () => {
  it('applies shadow classes for shadowed style', () => {
    useSiteSettings.mockReturnValue(makeSettings('shadowed'))
    const { container } = render(<MemoryRouter><ProjectCard project={PROJECT} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('hover:shadow-md')
  })

  it('applies border-only classes for bordered style', () => {
    useSiteSettings.mockReturnValue(makeSettings('bordered'))
    const { container } = render(<MemoryRouter><ProjectCard project={PROJECT} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('hover:border-gray-400')
    expect(container.firstChild.className).not.toContain('hover:shadow-md')
  })

  it('applies no shadow for minimal style', () => {
    useSiteSettings.mockReturnValue(makeSettings('minimal'))
    const { container } = render(<MemoryRouter><ProjectCard project={PROJECT} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('shadow-none')
    expect(container.firstChild.className).not.toContain('hover:shadow-md')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/ProjectCard.test.jsx
```

Expected: all 3 tests FAIL.

- [ ] **Step 3: Update ProjectCard.jsx**

Replace `src/components/ProjectCard.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'

export default function ProjectCard({ project }) {
  const { settings } = useSiteSettings()

  const decorClass =
    settings.card_style === 'bordered' ? 'border border-gray-200 shadow-none hover:border-gray-400' :
    settings.card_style === 'minimal'  ? 'border border-transparent shadow-none' :
    'border border-gray-200 shadow-sm hover:shadow-md'

  return (
    <Link to={`/projects/${project.id}`} className={`block ${decorClass} rounded-xl overflow-hidden transition-shadow`}>
      {project.cover_url ? (
        <img src={project.cover_url} alt={project.title} loading="lazy" className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-300 text-4xl">🗂</div>
      )}
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-1">{project.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{project.description}</p>
        <div className="flex gap-1 flex-wrap">
          {(project.tags ?? []).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run ProjectCard tests to verify all pass**

```bash
npx vitest run src/components/__tests__/ProjectCard.test.jsx
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectCard.jsx src/components/__tests__/ProjectCard.test.jsx
git commit -m "feat(project-card): card_style decoration from settings"
```

---

### Task 9: Home.jsx — dynamic hero copy

**Files:**
- Modify: `src/pages/Home.jsx`

No new test file — Home.jsx already reads from `useSiteSettings()`; functional coverage comes from existing integration of the context.

- [ ] **Step 1: Replace hero hardcoded content in Home.jsx**

In `src/pages/Home.jsx`, read new fields from settings at the top of the component (after the existing `useSiteSettings()` call):

```js
const heroName        = settings.hero_name        ?? 'Jimmy Hong'
const heroSubtitle    = settings.hero_subtitle     ?? 'QA Engineer / 品質架構師'
const heroTagline     = settings.hero_tagline      ?? '打造讓團隊信任的 QA 系統'
const heroDescription = settings.hero_description  ?? ''
const heroSkills      = settings.hero_skills       ?? ['測試策略', 'CI/CD 整合', '自動化框架', 'QA 流程設計']
```

- [ ] **Step 2: Update hero JSX — subtitle, name, tagline, description, skills**

Find and replace the five hardcoded pieces in the hero section:

**Subtitle (line 54):**
```jsx
// Before:
<p className="text-xs tracking-widest text-gray-400 uppercase mb-1">QA Engineer / 品質架構師</p>

// After:
<p className="text-xs tracking-widest text-gray-400 uppercase mb-1">{heroSubtitle}</p>
```

**Name h1 (line 55):**
```jsx
// Before:
<h1 className="text-3xl font-bold mb-1">Jimmy Hong</h1>

// After:
<h1 className="text-3xl font-bold mb-1">{heroName}</h1>
```

**Tagline (line 56):**
```jsx
// Before:
<p className="text-sm text-gray-500 mb-4">打造讓團隊信任的 QA 系統</p>

// After:
<p className="text-sm text-gray-500 mb-4">{heroTagline}</p>
```

**Description (lines 57–61):**
```jsx
// Before:
<p className="text-sm text-gray-500 leading-relaxed mb-5">
  專注測試流程設計與品質架構。<br />
  從流程標準化到自動化導入，<br />
  讓品質成為開發文化，而不是最後一道關卡。
</p>

// After:
<p className="text-sm text-gray-500 leading-relaxed mb-5">
  {heroDescription.split('\n').map((line, i, arr) => (
    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
  ))}
</p>
```

**Skills (lines 63–65):**
```jsx
// Before:
{['測試策略', 'CI/CD 整合', '自動化框架', 'QA 流程設計'].map(t => (

// After:
{heroSkills.map(t => (
```

**Avatar alt (line 51):**
```jsx
// Before:
<img src={settings.avatar_url} alt="Jimmy Hong" className="w-full h-full object-cover" />

// After:
<img src={settings.avatar_url} alt={heroName} className="w-full h-full object-cover" />
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat(home): hero copy from settings (name, subtitle, tagline, description, skills)"
```

---

### Task 10: AdminSettings.jsx — 品牌與文案 section + heading_font + card_style

**Files:**
- Modify: `src/pages/admin/AdminSettings.jsx`

This task is UI-only. No automated tests — verify manually in the dev server after.

- [ ] **Step 1: Add new fields to form state**

In the `useState` initializer (around line 61), add new fields:

```js
const [form, setForm] = useState({
  email: '', github_url: '', linkedin_url: '', avatar_url: '',
  photo_avatar_url: '', seo_keywords: '', seo_description: '',
  seo_photo_keywords: '', seo_photo_description: '',
  accent_color: '#111827', font_family: 'Noto Sans TC', hidden_pages: [],
  bg_color: '#ffffff', hidden_sections: [],
  brand_name: 'QA Lab',
  cta_text: '聯絡我',
  card_style: 'shadowed',
  heading_font: 'Noto Sans TC',
  hero_name: 'Jimmy Hong',
  hero_subtitle: 'QA Engineer / 品質架構師',
  hero_tagline: '打造讓團隊信任的 QA 系統',
  hero_description: '專注測試流程設計與品質架構。\n從流程標準化到自動化導入，\n讓品質成為開發文化，而不是最後一道關卡。',
  hero_skills: '測試策略, CI/CD 整合, 自動化框架, QA 流程設計',
})
```

Note: `hero_skills` is stored in form state as a comma-string (for KeywordInput). It gets converted to/from `text[]` on load/save.

- [ ] **Step 2: Update useEffect to handle hero_skills array → string conversion**

Find the `useEffect` block (around line 83) and update the `setForm` call:

```js
useEffect(() => {
  supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
    if (data) {
      setForm({
        ...data,
        hero_skills: (data.hero_skills ?? []).join(', '),
      })
      if (data.nav_tabs?.length) setNavTabs(data.nav_tabs)
    }
  })
}, [])
```

- [ ] **Step 3: Update handleSubmit to include new fields + convert hero_skills back to array**

In `handleSubmit` (around line 97), extend the Supabase update payload:

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
  brand_name: form.brand_name,
  cta_text: form.cta_text,
  card_style: form.card_style,
  heading_font: form.heading_font,
  hero_name: form.hero_name,
  hero_subtitle: form.hero_subtitle,
  hero_tagline: form.hero_tagline,
  hero_description: form.hero_description,
  hero_skills: form.hero_skills.split(',').map(t => t.trim()).filter(Boolean),
}).eq('id', 1)
```

Note: `handleSubmit` calls `refreshSettings()` after save — that re-fetches from DB and re-applies the full theme (including `heading_font`) via `SiteSettingsContext`. No manual `applyTheme` call needed here.

- [ ] **Step 3b: Update any existing live-preview applyTheme calls in the file**

The admin already has `applyTheme` calls for live preview (e.g., accent_color picker onChange, preset click handler). Search for every existing `applyTheme({` call in `AdminSettings.jsx` and add `heading_font: form.heading_font` to each one so the heading font stays consistent during live preview.

Example: if you find `applyTheme({ accent_color: ..., font_family: ..., bg_color: ... })`, update it to:

```js
applyTheme({ accent_color: ..., font_family: ..., bg_color: ..., heading_font: form.heading_font })
```

- [ ] **Step 4: Add 品牌與文案 section to the form JSX**

The form currently opens with `<form onSubmit={handleSubmit} className="flex flex-col gap-5">` followed by email, github_url, etc. Add the new 品牌與文案 section right after the first `<div>` (email field) is done but before the existing 外觀設定 section divider. Search for the line:

```jsx
<p className="text-sm font-semibold pt-2">外觀設定</p>
```

Insert this block immediately before it:

```jsx
<p className="text-sm font-semibold pt-2">品牌與文案</p>

<div>
  <label className="text-xs text-gray-500 mb-1 block">品牌名稱</label>
  <input name="brand_name" value={form.brand_name ?? ''} onChange={handleChange}
    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
</div>

<div>
  <label className="text-xs text-gray-500 mb-1 block">聯絡按鈕文字</label>
  <input name="cta_text" value={form.cta_text ?? ''} onChange={handleChange}
    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
</div>

<p className="text-sm font-semibold pt-2">Hero 文案</p>

<div>
  <label className="text-xs text-gray-500 mb-1 block">姓名</label>
  <input name="hero_name" value={form.hero_name ?? ''} onChange={handleChange}
    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
</div>

<div>
  <label className="text-xs text-gray-500 mb-1 block">職稱</label>
  <input name="hero_subtitle" value={form.hero_subtitle ?? ''} onChange={handleChange}
    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
</div>

<div>
  <label className="text-xs text-gray-500 mb-1 block">標語</label>
  <input name="hero_tagline" value={form.hero_tagline ?? ''} onChange={handleChange}
    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
</div>

<div>
  <label className="text-xs text-gray-500 mb-1 block">自我介紹 <span className="text-gray-400">（換行分段）</span></label>
  <textarea name="hero_description" value={form.hero_description ?? ''} onChange={handleChange} rows={4}
    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 resize-none" />
</div>

<div>
  <label className="text-xs text-gray-500 mb-1 block">技能標籤</label>
  <KeywordInput
    value={form.hero_skills ?? ''}
    onChange={v => setForm(f => ({ ...f, hero_skills: v }))}
  />
</div>
```

- [ ] **Step 5: Add heading_font dropdown to 外觀設定 section**

Find the existing `font_family` dropdown block. It looks like:

```jsx
<div>
  <label className="text-xs text-gray-500 mb-1 block">字型</label>
  <select name="font_family" ...>
```

Add this block immediately after the `font_family` closing `</div>`:

```jsx
<div>
  <label className="text-xs text-gray-500 mb-1 block">標題字型</label>
  <select
    name="heading_font"
    value={form.heading_font ?? 'Noto Sans TC'}
    onChange={e => {
      handleChange(e)
      applyTheme({
        accent_color: form.accent_color,
        font_family: form.font_family,
        bg_color: form.bg_color,
        heading_font: e.target.value,
      })
    }}
    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400"
  >
    {FONT_OPTIONS.map(f => (
      <option key={f.value} value={f.value}>{f.label}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 6: Add card_style selector to 外觀設定 section**

After the `heading_font` block, add:

```jsx
<div>
  <label className="text-xs text-gray-500 mb-2 block">卡片風格</label>
  <div className="flex gap-3">
    {[
      { value: 'shadowed', label: '陰影卡片' },
      { value: 'bordered', label: '框線卡片' },
      { value: 'minimal',  label: '簡約無框' },
    ].map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => setForm(f => ({ ...f, card_style: opt.value }))}
        className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
          form.card_style === opt.value
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-200 text-gray-500 hover:border-gray-400'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 7: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 8: Smoke test in dev server**

```bash
npm run dev
```

Open `http://localhost:5173/admin/settings`. Verify:
- 品牌與文案 section visible with all fields
- Hero 文案 section with name/subtitle/tagline/description/skills
- 外觀設定 has 標題字型 dropdown and 卡片風格 3-button selector
- Changing 標題字型 updates headings on the page in real time
- Changing 卡片風格 and saving changes blog/project cards
- 品牌名稱 saves and appears in Nav + Footer

- [ ] **Step 9: Commit**

```bash
git add src/pages/admin/AdminSettings.jsx
git commit -m "feat(admin): add 品牌與文案, hero copy, heading_font, card_style fields"
```

---

## Final check

```bash
npx vitest run
```

All tests pass → ready for finishing-a-development-branch.
