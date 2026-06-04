# Mobile Reading Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為文章頁手機閱讀加入三項功能：左右滑動切換篇章、文章頁 dark mode、字體大小三檔調整。

**Architecture:** 新增兩個 hook（`useArticleSettings`、`useSwipeNav`）和一個底部浮動工具列元件（`ArticleToolbar`）。`BlogPost` 整合三者，將 `article-dark` class 掛在 `<article>` 和 `<main>` 上，CSS cascade 自動套用到所有子元素（含 prose）。`MarkdownContent` 不需改動。

**Tech Stack:** React 18, react-router-dom v6, Tailwind CSS, Vitest + @testing-library/react

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/hooks/useArticleSettings.js` | fontSize + dark 狀態、localStorage 持久化 |
| Create | `src/hooks/useSwipeNav.js` | touch event → navigate prev/next |
| Create | `src/components/ArticleToolbar.jsx` | 底部浮動 A-/A+ + 🌙 UI |
| Create | `src/hooks/__tests__/useArticleSettings.test.js` | hook 單元測試 |
| Create | `src/hooks/__tests__/useSwipeNav.test.js` | hook 單元測試 |
| Create | `src/components/__tests__/ArticleToolbar.test.jsx` | component 測試 |
| Modify | `src/styles/index.css` | 新增 `.article-dark` 全區段色彩覆寫 |
| Modify | `src/pages/BlogPost.jsx` | 整合三個 hook/元件，掛 article-dark class |

---

## Task 1: `useArticleSettings` hook

**Files:**
- Create: `src/hooks/useArticleSettings.js`
- Create: `src/hooks/__tests__/useArticleSettings.test.js`

- [ ] **Step 1: 建立測試檔**

```js
// src/hooks/__tests__/useArticleSettings.test.js
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useArticleSettings } from '../useArticleSettings'

describe('useArticleSettings', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to md fontSize and light mode', () => {
    const { result } = renderHook(() => useArticleSettings())
    expect(result.current.fontSize).toBe('md')
    expect(result.current.dark).toBe(false)
  })

  it('incFontSize goes md→lg and caps at lg', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.incFontSize())
    expect(result.current.fontSize).toBe('lg')
    act(() => result.current.incFontSize())
    expect(result.current.fontSize).toBe('lg')
  })

  it('decFontSize goes md→sm and caps at sm', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.decFontSize())
    expect(result.current.fontSize).toBe('sm')
    act(() => result.current.decFontSize())
    expect(result.current.fontSize).toBe('sm')
  })

  it('toggleDark flips dark state', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.toggleDark())
    expect(result.current.dark).toBe(true)
    act(() => result.current.toggleDark())
    expect(result.current.dark).toBe(false)
  })

  it('persists fontSize to localStorage', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.incFontSize())
    expect(localStorage.getItem('article-font-size')).toBe('lg')
  })

  it('persists dark to localStorage', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.toggleDark())
    expect(localStorage.getItem('article-theme')).toBe('dark')
  })

  it('reads persisted fontSize on init', () => {
    localStorage.setItem('article-font-size', 'sm')
    const { result } = renderHook(() => useArticleSettings())
    expect(result.current.fontSize).toBe('sm')
  })

  it('reads persisted dark on init', () => {
    localStorage.setItem('article-theme', 'dark')
    const { result } = renderHook(() => useArticleSettings())
    expect(result.current.dark).toBe(true)
  })

  it('ignores invalid localStorage value for fontSize', () => {
    localStorage.setItem('article-font-size', 'xxl')
    const { result } = renderHook(() => useArticleSettings())
    expect(result.current.fontSize).toBe('md')
  })
})
```

- [ ] **Step 2: 執行測試，確認全部失敗**

```bash
npx vitest run src/hooks/__tests__/useArticleSettings.test.js
```

Expected: FAIL — "Cannot find module '../useArticleSettings'"

- [ ] **Step 3: 實作 hook**

```js
// src/hooks/useArticleSettings.js
import { useState } from 'react'

const SIZES = ['sm', 'md', 'lg']

function readStorage(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value) } catch {}
}

export function useArticleSettings() {
  const [fontSize, setFontSize] = useState(() => {
    const stored = readStorage('article-font-size', 'md')
    return SIZES.includes(stored) ? stored : 'md'
  })
  const [dark, setDark] = useState(() => readStorage('article-theme', 'light') === 'dark')

  function incFontSize() {
    setFontSize(prev => {
      const next = SIZES[Math.min(SIZES.indexOf(prev) + 1, SIZES.length - 1)]
      writeStorage('article-font-size', next)
      return next
    })
  }

  function decFontSize() {
    setFontSize(prev => {
      const next = SIZES[Math.max(SIZES.indexOf(prev) - 1, 0)]
      writeStorage('article-font-size', next)
      return next
    })
  }

  function toggleDark() {
    setDark(prev => {
      const next = !prev
      writeStorage('article-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return { fontSize, dark, incFontSize, decFontSize, toggleDark }
}
```

- [ ] **Step 4: 執行測試，確認全部通過**

```bash
npx vitest run src/hooks/__tests__/useArticleSettings.test.js
```

Expected: 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useArticleSettings.js src/hooks/__tests__/useArticleSettings.test.js
git commit -m "feat: add useArticleSettings hook (fontSize + dark mode with localStorage)"
```

---

## Task 2: `useSwipeNav` hook

**Files:**
- Create: `src/hooks/useSwipeNav.js`
- Create: `src/hooks/__tests__/useSwipeNav.test.js`

- [ ] **Step 1: 建立測試檔**

```js
// src/hooks/__tests__/useSwipeNav.test.js
import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))

import { useSwipeNav } from '../useSwipeNav'

function makeTouch(x, y) {
  return {
    touches: [{ clientX: x, clientY: y }],
    changedTouches: [{ clientX: x, clientY: y }],
  }
}

describe('useSwipeNav', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('returns a ref object', () => {
    const { result } = renderHook(() => useSwipeNav({ prevSlug: 'a', nextSlug: 'b' }))
    expect(result.current).toHaveProperty('current')
  })

  it('navigates to prevSlug on right swipe (deltaX > 80)', () => {
    const { result } = renderHook(() => useSwipeNav({ prevSlug: 'prev-post', nextSlug: 'next-post' }))
    const div = document.createElement('div')
    result.current.current = div
    div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(200, 100)))
    div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(310, 105)))
    expect(mockNavigate).toHaveBeenCalledWith('/blog/prev-post')
  })

  it('navigates to nextSlug on left swipe (deltaX < -80)', () => {
    const { result } = renderHook(() => useSwipeNav({ prevSlug: 'prev-post', nextSlug: 'next-post' }))
    const div = document.createElement('div')
    result.current.current = div
    div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(300, 100)))
    div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(180, 105)))
    expect(mockNavigate).toHaveBeenCalledWith('/blog/next-post')
  })

  it('does not navigate when vertical scroll detected (|deltaY| > 50)', () => {
    const { result } = renderHook(() => useSwipeNav({ prevSlug: 'a', nextSlug: 'b' }))
    const div = document.createElement('div')
    result.current.current = div
    div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(200, 100)))
    div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(310, 200)))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not navigate right when prevSlug is null', () => {
    const { result } = renderHook(() => useSwipeNav({ prevSlug: null, nextSlug: 'next' }))
    const div = document.createElement('div')
    result.current.current = div
    div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(200, 100)))
    div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(310, 105)))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not navigate left when nextSlug is null', () => {
    const { result } = renderHook(() => useSwipeNav({ prevSlug: 'prev', nextSlug: null }))
    const div = document.createElement('div')
    result.current.current = div
    div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(300, 100)))
    div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(180, 105)))
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run src/hooks/__tests__/useSwipeNav.test.js
```

Expected: FAIL — "Cannot find module '../useSwipeNav'"

- [ ] **Step 3: 實作 hook**

```js
// src/hooks/useSwipeNav.js
import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useSwipeNav({ prevSlug, nextSlug }) {
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let startX = 0
    let startY = 0

    function onStart(e) {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    function onEnd(e) {
      const deltaX = e.changedTouches[0].clientX - startX
      const deltaY = e.changedTouches[0].clientY - startY
      if (Math.abs(deltaY) > 50) return
      if (deltaX > 80 && prevSlug) navigate(`/blog/${prevSlug}`)
      if (deltaX < -80 && nextSlug) navigate(`/blog/${nextSlug}`)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
    }
  }, [prevSlug, nextSlug, navigate])

  return ref
}
```

- [ ] **Step 4: 執行測試，確認通過**

```bash
npx vitest run src/hooks/__tests__/useSwipeNav.test.js
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSwipeNav.js src/hooks/__tests__/useSwipeNav.test.js
git commit -m "feat: add useSwipeNav hook (left/right swipe → prev/next post)"
```

---

## Task 3: `ArticleToolbar` component

**Files:**
- Create: `src/components/ArticleToolbar.jsx`
- Create: `src/components/__tests__/ArticleToolbar.test.jsx`

- [ ] **Step 1: 建立測試檔**

```jsx
// src/components/__tests__/ArticleToolbar.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import ArticleToolbar from '../ArticleToolbar'

const defaults = {
  fontSize: 'md',
  dark: false,
  onInc: vi.fn(),
  onDec: vi.fn(),
  onToggleDark: vi.fn(),
}

describe('ArticleToolbar', () => {
  it('shows 16px label for md', () => {
    render(<ArticleToolbar {...defaults} />)
    expect(screen.getByText('16px')).toBeInTheDocument()
  })

  it('shows 14px label for sm', () => {
    render(<ArticleToolbar {...defaults} fontSize="sm" />)
    expect(screen.getByText('14px')).toBeInTheDocument()
  })

  it('shows 18px label for lg', () => {
    render(<ArticleToolbar {...defaults} fontSize="lg" />)
    expect(screen.getByText('18px')).toBeInTheDocument()
  })

  it('A− is disabled when fontSize is sm', () => {
    render(<ArticleToolbar {...defaults} fontSize="sm" />)
    expect(screen.getByLabelText('縮小字體')).toBeDisabled()
  })

  it('A+ is disabled when fontSize is lg', () => {
    render(<ArticleToolbar {...defaults} fontSize="lg" />)
    expect(screen.getByLabelText('放大字體')).toBeDisabled()
  })

  it('A− and A+ both enabled at md', () => {
    render(<ArticleToolbar {...defaults} fontSize="md" />)
    expect(screen.getByLabelText('縮小字體')).not.toBeDisabled()
    expect(screen.getByLabelText('放大字體')).not.toBeDisabled()
  })

  it('calls onInc when A+ clicked', () => {
    const onInc = vi.fn()
    render(<ArticleToolbar {...defaults} onInc={onInc} />)
    fireEvent.click(screen.getByLabelText('放大字體'))
    expect(onInc).toHaveBeenCalledOnce()
  })

  it('calls onDec when A− clicked', () => {
    const onDec = vi.fn()
    render(<ArticleToolbar {...defaults} onDec={onDec} />)
    fireEvent.click(screen.getByLabelText('縮小字體'))
    expect(onDec).toHaveBeenCalledOnce()
  })

  it('shows 切換暗色模式 aria-label in light mode', () => {
    render(<ArticleToolbar {...defaults} dark={false} />)
    expect(screen.getByLabelText('切換暗色模式')).toBeInTheDocument()
  })

  it('shows 切換亮色模式 aria-label in dark mode', () => {
    render(<ArticleToolbar {...defaults} dark={true} />)
    expect(screen.getByLabelText('切換亮色模式')).toBeInTheDocument()
  })

  it('calls onToggleDark when toggle button clicked', () => {
    const onToggleDark = vi.fn()
    render(<ArticleToolbar {...defaults} onToggleDark={onToggleDark} />)
    fireEvent.click(screen.getByLabelText('切換暗色模式'))
    expect(onToggleDark).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run src/components/__tests__/ArticleToolbar.test.jsx
```

Expected: FAIL — "Cannot find module '../ArticleToolbar'"

- [ ] **Step 3: 實作元件**

```jsx
// src/components/ArticleToolbar.jsx
const FONT_LABELS = { sm: '14px', md: '16px', lg: '18px' }

export default function ArticleToolbar({ fontSize, dark, onInc, onDec, onToggleDark }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 lg:hidden z-40 border-t shadow-sm"
      style={dark
        ? { backgroundColor: '#1e1e1e', borderColor: '#333' }
        : { backgroundColor: '#ffffff', borderColor: '#f3f4f6' }}
    >
      <div className="flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-3">
          <button
            onClick={onDec}
            disabled={fontSize === 'sm'}
            className="text-sm disabled:opacity-30 px-1"
            style={{ color: dark ? '#9ca3af' : '#6b7280' }}
            aria-label="縮小字體"
          >
            A−
          </button>
          <span
            className="text-xs w-8 text-center"
            style={{ color: dark ? '#6b7280' : '#9ca3af' }}
          >
            {FONT_LABELS[fontSize]}
          </span>
          <button
            onClick={onInc}
            disabled={fontSize === 'lg'}
            className="text-sm disabled:opacity-30 px-1"
            style={{ color: dark ? '#9ca3af' : '#6b7280' }}
            aria-label="放大字體"
          >
            A+
          </button>
        </div>
        <button
          onClick={onToggleDark}
          className="text-lg leading-none"
          aria-label={dark ? '切換亮色模式' : '切換暗色模式'}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 執行測試，確認通過**

```bash
npx vitest run src/components/__tests__/ArticleToolbar.test.jsx
```

Expected: 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ArticleToolbar.jsx src/components/__tests__/ArticleToolbar.test.jsx
git commit -m "feat: add ArticleToolbar component (font size A-/A+ + dark mode toggle)"
```

---

## Task 4: Dark Mode CSS in `index.css`

**Files:**
- Modify: `src/styles/index.css`

`article-dark` 掛在 `<article>` 上，CSS cascade 自動套用到標題、meta、prose 等所有子元素。

- [ ] **Step 1: 在 `index.css` 的 `@tailwind utilities;` 之後加入以下 CSS**

```css
/* Article dark mode — applied to <article> element */
.article-dark {
  color: #e5e5e5;
}

.article-dark .prose {
  color: #e5e5e5;
}

.article-dark .prose h1,
.article-dark .prose h2,
.article-dark .prose h3,
.article-dark .prose h4 {
  color: #f0f0f0;
}

.article-dark .prose a {
  color: #93c5fd;
}

.article-dark .prose strong {
  color: #f0f0f0;
}

.article-dark .prose blockquote {
  border-left-color: #444;
  color: #aaaaaa;
}

.article-dark .prose hr {
  border-color: #333;
}

.article-dark .prose thead {
  color: #f0f0f0;
  border-bottom-color: #444;
}

.article-dark .prose tbody tr {
  border-bottom-color: #333;
}

/* Series nav box */
.article-dark .bg-gray-50 {
  background-color: #2a2a2a;
  border-color: #333;
}

/* Tags */
.article-dark .bg-gray-100 {
  background-color: #2a2a2a;
  color: #9ca3af;
}

/* Share buttons border */
.article-dark .border-gray-100,
.article-dark .border-gray-200 {
  border-color: #444;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add .article-dark CSS for dark mode reading experience"
```

---

## Task 5: 整合進 `BlogPost.jsx`

**Files:**
- Modify: `src/pages/BlogPost.jsx`

- [ ] **Step 1: 新增 import（在現有 import 區塊末尾）**

```jsx
import { useArticleSettings } from '../hooks/useArticleSettings'
import { useSwipeNav } from '../hooks/useSwipeNav'
import ArticleToolbar from '../components/ArticleToolbar'
```

- [ ] **Step 2: 在 `const progress = useReadingProgress()` 之後初始化 hooks**

```jsx
const { fontSize, dark, incFontSize, decFontSize, toggleDark } = useArticleSettings()
const swipeRef = useSwipeNav({
  prevSlug: adjacent.prev?.slug ?? null,
  nextSlug: adjacent.next?.slug ?? null,
})

const fontSizeMap = { sm: '14px', md: '16px', lg: '18px' }
```

- [ ] **Step 3: 套用 dark 背景到 `<main>`，加底部 padding（避免工具列遮內容）**

找到：
```jsx
      <main className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
```

改為：
```jsx
      <main className={`max-w-5xl mx-auto px-6 sm:px-12 py-16 pb-28 lg:pb-16 transition-colors${dark ? ' bg-[#1a1a1a]' : ''}`}>
```

- [ ] **Step 4: 套用 `article-dark` class 和字級到 `<article>`**

找到：
```jsx
          <article>
```

改為：
```jsx
          <article
            ref={swipeRef}
            style={{ fontSize: fontSizeMap[fontSize] }}
            className={dark ? 'article-dark' : ''}
          >
```

- [ ] **Step 5: 在 `<ScrollToTop />` 之後渲染 `ArticleToolbar`**

找到：
```jsx
      <Footer />
      <ScrollToTop />
```

改為：
```jsx
      <Footer />
      <ScrollToTop />
      <ArticleToolbar
        fontSize={fontSize}
        dark={dark}
        onInc={incFontSize}
        onDec={decFontSize}
        onToggleDark={toggleDark}
      />
```

- [ ] **Step 6: 執行全部測試，確認無 regression**

```bash
npx vitest run
```

Expected: 全部 PASS

- [ ] **Step 7: Commit**

```bash
git add src/pages/BlogPost.jsx
git commit -m "feat: wire mobile reading toolbar and swipe nav into BlogPost"
```

---

## Task 6: 手動驗收

- [ ] **Step 1: 啟動 dev server**

```bash
npm run dev
```

- [ ] **Step 2: 開啟任一文章頁，Chrome DevTools → 375px 手機尺寸**

- [ ] 底部工具列出現，顯示 `A−  16px  A+  🌙`
- [ ] 點 A+ → 字級變 18px，再點 → 停在 18px（A+ disabled 變暗）
- [ ] 點 A− → 字級縮回，再點到底 → 停在 14px（A− disabled 變暗）
- [ ] 點 🌙 → 文章背景 + 文字變暗色，工具列背景也變深
- [ ] 點 ☀️ → 恢復亮色模式
- [ ] 重新整理頁面 → 字級和 dark mode 維持（localStorage 持久化）

- [ ] **Step 3: 桌機尺寸（1024px+）確認工具列不出現**

- [ ] **Step 4: 滑動測試（Chrome DevTools → Toggle device toolbar）**

用滑鼠拖曳模擬 touch：
- [ ] 右滑 → 跳到上一篇（若 adjacent.prev 存在）
- [ ] 左滑 → 跳到下一篇（若 adjacent.next 存在）
- [ ] 沒有目標篇時靜默不動
