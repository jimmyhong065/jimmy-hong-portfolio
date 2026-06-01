# Mobile Nav Bottom Tab Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fixed bottom Tab Bar (icon + text) to both Nav.jsx and PhotoNav.jsx so mobile users have usable navigation instead of the current text-wrapping top nav.

**Architecture:** Below `md` breakpoint, hide top nav links entirely and render a `fixed bottom-0` tab bar inside the same component. Desktop layout is unchanged. Footer gets extra bottom padding on mobile so content doesn't disappear under the tab bar.

**Tech Stack:** React, React Router `useLocation`, Tailwind CSS, inline SVG icons (no new dependencies)

---

## File Map

| File | Change |
|------|--------|
| `index.html` | Add `viewport-fit=cover` to viewport meta |
| `src/components/Nav.jsx` | Hide desktop links on mobile; add bottom tab bar |
| `src/components/PhotoNav.jsx` | Hide desktop links on mobile; add bottom tab bar |
| `src/components/Footer.jsx` | `pb-20 md:pb-10` so content clears the tab bar on mobile |
| `src/components/__tests__/PhotoNav.test.jsx` | Fix tests broken by duplicate text in DOM |

---

## Task 1: Add viewport-fit=cover

**Files:**
- Modify: `index.html:6`

- [ ] **Step 1: Update viewport meta**

Change line 6 of `index.html` from:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
to:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "fix: add viewport-fit=cover for iOS safe area support"
```

---

## Task 2: Update Nav.jsx with mobile Tab Bar

**Files:**
- Modify: `src/components/Nav.jsx`

- [ ] **Step 1: Replace Nav.jsx with updated version**

```jsx
import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

const TABS = [
  {
    to: '/projects',
    label: '作品集',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/blog',
    label: '部落格',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <path d="M14 3v6h6"/><path d="M9 12h6M9 16h6"/>
      </svg>
    ),
  },
  {
    to: '/services',
    label: '合作方式',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    ),
  },
  {
    to: '/about',
    label: '關於我',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

export default function Nav() {
  const { settings } = useSettings()
  const location = useLocation()

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-12 py-5 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-wide">Jimmy Hong</Link>
          {/* Desktop nav — hidden on mobile */}
          <ul className="hidden md:flex gap-8 list-none">
            <li><Link to="/projects" className="text-sm text-gray-500 hover:text-gray-900">作品集</Link></li>
            <li><Link to="/blog" className="text-sm text-gray-500 hover:text-gray-900">部落格</Link></li>
            <li><Link to="/services" className="text-sm text-gray-500 hover:text-gray-900">合作方式</Link></li>
            <li><Link to="/about" className="text-sm text-gray-500 hover:text-gray-900">關於我</Link></li>
          </ul>
          {/* Desktop CTA — hidden on mobile */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/rss.xml" target="_blank" rel="noreferrer" title="RSS 訂閱"
              className="text-gray-400 hover:text-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
              </svg>
            </a>
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                聯絡我
              </a>
            )}
          </div>
        </div>
      </nav>
      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-4 list-none m-0 p-0">
          {TABS.map(tab => {
            const active = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={`flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none ${active ? 'text-gray-900' : 'text-gray-400'}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
```

- [ ] **Step 2: Run dev server and verify visually at 390px width**

```bash
npm run dev
```

Open `http://localhost:5173`, open DevTools → set device to iPhone 14 (390×844). Verify:
- Top nav shows only "Jimmy Hong" logo
- Bottom bar shows 4 tabs with icons + labels
- Tapping each tab navigates correctly
- Active tab is dark, others are gray

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.jsx
git commit -m "feat: add mobile bottom tab bar to Nav"
```

---

## Task 3: Create Nav.test.jsx

**Files:**
- Create: `src/components/__tests__/Nav.test.jsx`

- [ ] **Step 1: Write tests**

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Nav from '../Nav'

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: { email: 'test@example.com' } }),
}))

function renderNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Nav />
    </MemoryRouter>
  )
}

describe('Nav', () => {
  it('renders brand link', () => {
    renderNav()
    expect(screen.getByText('Jimmy Hong')).toBeInTheDocument()
  })

  it('renders all 4 tab labels in bottom bar', () => {
    renderNav()
    // Each label appears twice: once in hidden desktop nav, once in tab bar
    expect(screen.getAllByText('作品集')).toHaveLength(2)
    expect(screen.getAllByText('部落格')).toHaveLength(2)
    expect(screen.getAllByText('合作方式')).toHaveLength(2)
    expect(screen.getAllByText('關於我')).toHaveLength(2)
  })

  it('marks /projects tab active when on projects route', () => {
    renderNav('/projects')
    // The tab bar link (second instance) should have text-gray-900
    const tabLinks = screen.getAllByText('作品集')
    const tabBarLink = tabLinks[1].closest('a')
    expect(tabBarLink.className).toContain('text-gray-900')
  })

  it('marks /projects tab active for nested routes like /projects/1', () => {
    renderNav('/projects/1')
    const tabLinks = screen.getAllByText('作品集')
    const tabBarLink = tabLinks[1].closest('a')
    expect(tabBarLink.className).toContain('text-gray-900')
  })

  it('inactive tabs use text-gray-400', () => {
    renderNav('/projects')
    const blogLinks = screen.getAllByText('部落格')
    const tabBarLink = blogLinks[1].closest('a')
    expect(tabBarLink.className).toContain('text-gray-400')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test -- Nav.test
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/__tests__/Nav.test.jsx
git commit -m "test: add Nav mobile tab bar tests"
```

---

## Task 4: Update PhotoNav.jsx with mobile Tab Bar

**Files:**
- Modify: `src/components/PhotoNav.jsx`

- [ ] **Step 1: Replace PhotoNav.jsx with updated version**

```jsx
import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'

export default function PhotoNav() {
  const { settings } = useSettings()
  const location = useLocation()
  const onPhoto = location.pathname.startsWith('/photo')

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-4 grid grid-cols-3 items-center">
          {/* Left — hidden on mobile */}
          <div className="hidden md:flex items-center gap-6">
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

          {/* Center — always visible, full width on mobile */}
          <div className="flex justify-center col-span-3 md:col-span-1">
            <Link to="/photo" className="text-xl font-bold tracking-widest">
              r.bing recording
            </Link>
          </div>

          {/* Right — hidden on mobile */}
          <div className="hidden md:flex items-center justify-end gap-6">
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

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-4 list-none m-0 p-0">
          {/* 作品集 */}
          <li>
            <Link
              to="/photo"
              className={`flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none ${onPhoto ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>作品集</span>
            </Link>
          </li>
          {/* Instagram */}
          <li>
            <a
              href="https://www.instagram.com/r.bing_recording/"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none text-gray-400"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              <span>Instagram</span>
            </a>
          </li>
          {/* 聯絡我 */}
          {settings.email && (
            <li>
              <a
                href={`mailto:${settings.email}`}
                className="flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none text-gray-400"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span>聯絡我</span>
              </a>
            </li>
          )}
          {/* QA 網站 */}
          <li>
            <Link
              to="/"
              className={`flex flex-col items-center py-2 gap-0.5 text-[10px] leading-none ${location.pathname === '/' ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12L12 3L21 12"/><path d="M9 21V12H15V21"/><line x1="3" y1="21" x2="21" y2="21"/>
              </svg>
              <span>QA 網站</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  )
}
```

Note: `grid-cols-4` renders 4 items when email is set, 3 items when not (last cell empty — acceptable edge case since email is always configured in production).

- [ ] **Step 2: Verify visually at 390px width**

Navigate to `http://localhost:5173/photo`. Verify:
- Top bar shows only "r.bing recording" centered (logo spans full width on mobile)
- Bottom bar shows Camera/Instagram/Mail/Home icons with labels
- 作品集 tab is dark on `/photo` routes

- [ ] **Step 3: Commit**

```bash
git add src/components/PhotoNav.jsx
git commit -m "feat: add mobile bottom tab bar to PhotoNav"
```

---

## Task 5: Fix PhotoNav.test.jsx

**Files:**
- Modify: `src/components/__tests__/PhotoNav.test.jsx`

The existing tests use `getByText` for labels that now appear twice in the DOM (once in hidden desktop nav, once in tab bar). Replace with `getAllByText(...).length >= 1`.

- [ ] **Step 1: Run existing tests to confirm they fail**

```bash
npm test -- PhotoNav.test
```

Expected: tests throw `Found multiple elements with text...` for '作品集', 'Instagram', 'QA 網站', '聯絡我'.

- [ ] **Step 2: Update PhotoNav.test.jsx**

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import PhotoNav from '../PhotoNav'

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: { email: 'test@example.com' } }),
}))

describe('PhotoNav', () => {
  function renderNav(initialPath = '/photo') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <PhotoNav />
      </MemoryRouter>
    )
  }

  it('renders brand name', () => {
    renderNav()
    expect(screen.getByText('r.bing recording')).toBeInTheDocument()
  })

  it('renders 作品集 in both desktop nav and tab bar', () => {
    renderNav()
    expect(screen.getAllByText('作品集')).toHaveLength(2)
  })

  it('renders Instagram in both desktop nav and tab bar', () => {
    renderNav()
    expect(screen.getAllByText('Instagram')).toHaveLength(2)
  })

  it('renders QA 網站 in both desktop nav and tab bar', () => {
    renderNav()
    expect(screen.getAllByText('QA 網站')).toHaveLength(2)
  })

  it('renders 聯絡我 in both desktop nav and tab bar when email is set', () => {
    renderNav()
    expect(screen.getAllByText('聯絡我')).toHaveLength(2)
  })

  it('marks 作品集 tab active when on /photo route', () => {
    renderNav('/photo')
    const links = screen.getAllByText('作品集')
    const tabBarLink = links[1].closest('a')
    expect(tabBarLink.className).toContain('text-gray-900')
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npm test -- PhotoNav.test
```

Expected: 6 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/__tests__/PhotoNav.test.jsx
git commit -m "test: update PhotoNav tests for dual nav DOM presence"
```

---

## Task 6: Update Footer.jsx for mobile clearance

**Files:**
- Modify: `src/components/Footer.jsx:5`

The tab bar is ~60px tall and `fixed bottom-0`. Footer needs extra bottom padding on mobile so its content doesn't sit behind the tab bar when scrolled to the bottom.

- [ ] **Step 1: Update Footer className**

Change `py-10` to `pt-10 pb-24 md:py-10`:

```jsx
<footer className="border-t border-gray-100 pt-10 pb-24 md:py-10 px-4 md:px-12">
```

`pb-24` = 96px. Tab bar is ~60px + safe area. 96px gives comfortable clearance.

- [ ] **Step 2: Verify on mobile**

On iPhone 14 simulation, scroll to bottom of `/blog` page. Footer links and copyright should be fully visible above the tab bar.

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.jsx
git commit -m "fix: add mobile bottom padding to Footer for tab bar clearance"
```
