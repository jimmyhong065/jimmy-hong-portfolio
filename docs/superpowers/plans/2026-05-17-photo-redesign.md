# Photography Domain Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/photo` domain to editorial, image-forward aesthetic — centered brand nav, masonry gallery, minimized hero.

**Architecture:** 4 component/page files modified in order: PhotoNav (nav layout) → PhotoCard (remove fixed aspect ratio) → PhotoHome (hero + masonry grid) → PhotoDetail (masonry gallery). CSS-only masonry via `columns-N` — no new dependencies.

**Tech Stack:** React 18, Tailwind CSS v3, CSS columns masonry

---

## Files

- Modify: `src/components/PhotoNav.jsx`
- Modify: `src/components/PhotoCard.jsx`
- Modify: `src/pages/photo/PhotoHome.jsx`
- Modify: `src/pages/photo/PhotoDetail.jsx`
- Test: `src/components/__tests__/PhotoNav.test.jsx`
- Test: `src/components/__tests__/PhotoCard.test.jsx`

---

### Task 1: PhotoNav — 3-column centered brand layout

**Files:**
- Modify: `src/components/PhotoNav.jsx`
- Test: `src/components/__tests__/PhotoNav.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/PhotoNav.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import PhotoNav from '../PhotoNav'

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: { email: 'test@example.com' } }),
}))

describe('PhotoNav', () => {
  function renderNav() {
    return render(
      <MemoryRouter>
        <PhotoNav />
      </MemoryRouter>
    )
  }

  it('renders brand name centered', () => {
    renderNav()
    expect(screen.getByText('r.bing recording')).toBeInTheDocument()
  })

  it('renders 作品集 link on left', () => {
    renderNav()
    expect(screen.getByText('作品集')).toBeInTheDocument()
  })

  it('renders Instagram link', () => {
    renderNav()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('renders QA 網站 link on right', () => {
    renderNav()
    expect(screen.getByText('QA 網站')).toBeInTheDocument()
  })

  it('renders 聯絡我 when email is set', () => {
    renderNav()
    expect(screen.getByText('聯絡我')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/__tests__/PhotoNav.test.jsx
```

Expected: FAIL (some assertions fail — `作品集` not rendered yet)

- [ ] **Step 3: Rewrite PhotoNav**

Replace `src/components/PhotoNav.jsx` with:

```jsx
import { Link } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

export default function PhotoNav() {
  const { settings } = useSettings()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-8 py-4 grid grid-cols-3 items-center">
        {/* Left */}
        <div className="flex items-center gap-6">
          <Link to="/photo" className="text-sm text-gray-600 hover:text-gray-900">
            作品集
          </Link>
          <a
            href="https://www.instagram.com/r.bing_recording/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Instagram
          </a>
        </div>

        {/* Center */}
        <div className="flex justify-center">
          <Link to="/photo" className="text-xl font-bold tracking-widest">
            r.bing recording
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-6">
          {settings.email && (
            <a
              href={`mailto:${settings.email}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              聯絡我
            </a>
          )}
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">
            QA 網站
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/__tests__/PhotoNav.test.jsx
```

Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/components/PhotoNav.jsx src/components/__tests__/PhotoNav.test.jsx
git commit -m "feat: redesign PhotoNav with centered brand name, 3-column layout"
```

---

### Task 2: PhotoCard — remove fixed aspect ratio, borderless

**Files:**
- Modify: `src/components/PhotoCard.jsx`
- Test: `src/components/__tests__/PhotoCard.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/PhotoCard.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PhotoCard from '../PhotoCard'

const project = {
  id: 'abc',
  title: '人像作品',
  cover_url: 'https://example.com/photo.jpg',
  tags: ['人像', '商業'],
}

describe('PhotoCard', () => {
  function renderCard(p = project) {
    return render(
      <MemoryRouter>
        <PhotoCard project={p} />
      </MemoryRouter>
    )
  }

  it('renders title', () => {
    renderCard()
    expect(screen.getByText('人像作品')).toBeInTheDocument()
  })

  it('renders cover image with natural height (no aspect ratio class)', () => {
    renderCard()
    const img = screen.getByAltText('人像作品')
    expect(img.className).not.toMatch(/aspect-/)
    expect(img.className).toMatch(/h-auto/)
  })

  it('renders tags', () => {
    renderCard()
    expect(screen.getByText('人像')).toBeInTheDocument()
    expect(screen.getByText('商業')).toBeInTheDocument()
  })

  it('links to /photo/:id', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/photo/abc')
  })

  it('renders placeholder when no cover_url', () => {
    renderCard({ ...project, cover_url: null })
    expect(screen.queryByRole('img')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/__tests__/PhotoCard.test.jsx
```

Expected: FAIL (`h-auto` not in image className)

- [ ] **Step 3: Rewrite PhotoCard**

Replace `src/components/PhotoCard.jsx` with:

```jsx
import { Link } from 'react-router-dom'

export default function PhotoCard({ project }) {
  return (
    <Link to={`/photo/${project.id}`} className="block group">
      {project.cover_url ? (
        <img
          src={project.cover_url}
          alt={project.title}
          className="w-full h-auto object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100" />
      )}
      <div className="pt-2 pb-4">
        <h3 className="text-sm font-semibold mb-1">{project.title}</h3>
        <div className="flex gap-1 flex-wrap">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs text-gray-400">{t}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/__tests__/PhotoCard.test.jsx
```

Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/components/PhotoCard.jsx src/components/__tests__/PhotoCard.test.jsx
git commit -m "feat: redesign PhotoCard — natural image height, borderless, editorial style"
```

---

### Task 3: PhotoHome — minimized hero + masonry grid

**Files:**
- Modify: `src/pages/photo/PhotoHome.jsx`

No new test file — visual/layout changes not suited to unit tests. Manual verification in browser.

- [ ] **Step 1: Rewrite PhotoHome**

Replace `src/pages/photo/PhotoHome.jsx` with:

```jsx
import PhotoNav from '../../components/PhotoNav'
import Footer from '../../components/Footer'
import SEOHead from '../../components/SEOHead'
import PhotoCard from '../../components/PhotoCard'
import { usePhotoProjects } from '../../hooks/usePhotoProjects'
import { useSettings } from '../../hooks/useSettings'

const PHOTO_SERVICES = [
  { title: '人像攝影', desc: '個人形象照、畢業照、情侶寫真' },
  { title: '活動紀錄', desc: '演唱會、展覽、品牌活動現場攝影' },
  { title: '商業攝影', desc: '商品拍攝、品牌視覺、空間攝影' },
]

export default function PhotoHome() {
  const { projects, loading } = usePhotoProjects()
  const { settings } = useSettings()

  return (
    <>
      <SEOHead title="r.bing recording | 攝影作品集" description="用鏡頭記錄真實的瞬間。" />
      <PhotoNav />
      <main className="max-w-6xl mx-auto px-8">

        {/* Hero — minimized */}
        <div className="flex items-center gap-4 py-10 border-b border-gray-100 mb-10">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            <img
              src={settings.avatar_url || '/avatar.jpg'}
              alt="r.bing recording"
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">r.bing recording</p>
            <p className="text-xs text-gray-500">用鏡頭記錄真實的瞬間</p>
          </div>
          <div className="flex items-center gap-3">
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                預約洽詢
              </a>
            )}
            <a
              href="https://www.instagram.com/r.bing_recording/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-md"
            >
              Instagram
            </a>
          </div>
        </div>

        {/* Masonry gallery */}
        {loading ? (
          <p className="text-sm text-gray-400 py-8">載入中…</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-400 py-8">尚無作品。</p>
        ) : (
          <div className="columns-3 gap-6 [&>*]:break-inside-avoid [&>*]:mb-6 mb-16">
            {projects.map(p => <PhotoCard key={p.id} project={p} />)}
          </div>
        )}

        {/* Services */}
        <div className="mt-16 mb-20 border-t border-gray-100 pt-12">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-8">Services</p>
          <div className="grid grid-cols-3 gap-8">
            {PHOTO_SERVICES.map(s => (
              <div key={s.title}>
                <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open http://localhost:5173/photo — check:
- Hero is compact (small avatar, one line of text, CTA on right)
- Gallery shows masonry layout (images vary in height, 3 columns)
- Services section at bottom, separated by border

- [ ] **Step 3: Commit**

```bash
git add src/pages/photo/PhotoHome.jsx
git commit -m "feat: redesign PhotoHome — minimized hero, masonry gallery, cleaner services"
```

---

### Task 4: PhotoDetail — masonry image gallery

**Files:**
- Modify: `src/pages/photo/PhotoDetail.jsx`

- [ ] **Step 1: Update image gallery section in PhotoDetail**

Replace `src/pages/photo/PhotoDetail.jsx` with:

```jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PhotoNav from '../../components/PhotoNav'
import Footer from '../../components/Footer'
import SEOHead from '../../components/SEOHead'
import MarkdownContent from '../../components/MarkdownContent'
import { supabase } from '../../lib/supabase'

export default function PhotoDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('photo_projects')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error) setProject(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <>
      <PhotoNav />
      <div className="max-w-4xl mx-auto px-8 py-16 text-sm text-gray-400">載入中…</div>
      <Footer />
    </>
  )

  if (!project) return (
    <>
      <PhotoNav />
      <div className="max-w-4xl mx-auto px-8 py-16 text-sm text-gray-400">找不到此作品。</div>
      <Footer />
    </>
  )

  return (
    <>
      <SEOHead title={`${project.title} | r.bing recording`} description={project.description} />
      <PhotoNav />
      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex gap-2 flex-wrap mb-3">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs text-gray-400">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-10">{project.title}</h1>

        {/* Masonry image gallery */}
        {(project.images ?? []).length > 0 && (
          <div className="columns-2 gap-4 [&>*]:break-inside-avoid [&>*]:mb-4 mb-12">
            {project.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${project.title} ${i + 1}`}
                className="w-full h-auto rounded-sm"
              />
            ))}
          </div>
        )}

        <MarkdownContent content={project.content} />

        <div className="mt-12">
          <Link to="/photo" className="text-xs text-gray-400 hover:text-gray-700">← 返回作品集</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:5173/photo (add a test project in admin with multiple images first if needed).

Navigate to a photo detail page — check:
- Images render at natural height (no fixed aspect ratio)
- 2-column masonry layout
- Tags are plain text (no background chip)

- [ ] **Step 3: Commit**

```bash
git add src/pages/photo/PhotoDetail.jsx
git commit -m "feat: redesign PhotoDetail gallery — masonry layout, natural image height"
```

---

### Task 5: Build and deploy

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds, no errors

- [ ] **Step 3: Deploy to Cloudflare Pages**

```bash
npx wrangler pages deploy dist --project-name jimmy-hong-portfolio --commit-dirty=true
```

Expected: `✨ Deployment complete!`

- [ ] **Step 4: Verify on production**

Open https://jimmy-hong-portfolio.pages.dev/photo — check all 3 sections render correctly.

- [ ] **Step 5: Commit any remaining changes and push**

```bash
git push origin main
```
