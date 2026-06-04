# Mobile Reading Experience — Design Spec

**Date:** 2026-06-04  
**Scope:** BlogPost 文章頁（手機專屬強化，桌機不受影響）

---

## Goals

1. 左右滑動切換上/下一篇文章
2. 文章頁 dark mode（護眼夜間閱讀）
3. 字體大小調整 A- / A+（三檔）

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useArticleSettings.js` | fontSize + dark state + localStorage 持久化 |
| `src/hooks/useSwipeNav.js` | touch event handler → react-router navigate |
| `src/components/ArticleToolbar.jsx` | 底部浮動工具列 UI |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/BlogPost.jsx` | 掛 useArticleSettings、useSwipeNav；render ArticleToolbar |
| `src/components/MarkdownContent.jsx` | 接受 `dark` prop，加 className |
| `src/styles/index.css` | `.article-dark` 覆寫 prose 色彩 |

---

## Feature Details

### 1. Swipe Navigation (`useSwipeNav`)

- 監聽 `touchstart` / `touchend` on `<article>` ref
- 判定條件：`|deltaX| > 80px` 且 `|deltaY| < 50px`
- 右滑（deltaX > 80）→ navigate 上一篇（`adjacent.prev`）
- 左滑（deltaX < -80）→ navigate 下一篇（`adjacent.next`）
- 沒有目標頁時靜默不動
- 無視覺動畫（SPA 跳頁已足夠即時）

```js
// 簽名
function useSwipeNav({ prevSlug, nextSlug })
// 回傳 ref，掛到 <article ref={swipeRef}>
```

### 2. Article Settings (`useArticleSettings`)

狀態：
- `fontSize`: `'sm' | 'md' | 'lg'`，預設 `'md'`
- `dark`: `boolean`，預設 `false`

localStorage keys：
- `article-font-size`（值：`'sm' | 'md' | 'lg'`）
- `article-theme`（值：`'dark' | 'light'`）

字級對照：
| 值 | CSS font-size |
|----|--------------|
| sm | 14px |
| md | 16px（預設） |
| lg | 18px |

```js
// 簽名
function useArticleSettings()
// 回傳 { fontSize, dark, incFontSize, decFontSize, toggleDark }
```

### 3. ArticleToolbar Component

- 固定在 viewport 底部，`lg:hidden`（桌機不顯示）
- 高度 48px，背景 white / dark 時 `#1e1e1e`，上方細線
- 佈局：左側字級控制，右側 dark toggle

```
┌─────────────────────────────────────┐
│  A−   14px   A+              🌙      │
└─────────────────────────────────────┘
```

- A− disabled 當 fontSize === 'sm'
- A+ disabled 當 fontSize === 'lg'
- 中間顯示目前字級 px 數
- 🌙 dark 時顯示 ☀️

### 4. Dark Mode CSS (`.article-dark`)

作用範圍限 `.article-dark .prose`：

```css
.article-dark { background: #1a1a1a; }
.article-dark .prose { color: #e5e5e5; }
.article-dark .prose h1,
.article-dark .prose h2,
.article-dark .prose h3 { color: #f0f0f0; }
.article-dark .prose a { color: #93c5fd; }
.article-dark .prose blockquote { border-color: #444; color: #aaa; }
.article-dark .prose hr { border-color: #333; }
.article-dark .prose strong { color: #f0f0f0; }
```

- code block（SyntaxHighlighter）背景已有自己的樣式，不覆寫
- Nav / Footer / 其他頁面不受影響

---

## Integration in BlogPost.jsx

```jsx
const { fontSize, dark, incFontSize, decFontSize, toggleDark } = useArticleSettings()
const swipeRef = useSwipeNav({ prevSlug: adjacent.prev?.slug, nextSlug: adjacent.next?.slug })

const fontSizeMap = { sm: '14px', md: '16px', lg: '18px' }

// 套用到 article
<article ref={swipeRef} style={{ fontSize: fontSizeMap[fontSize] }}>

// MarkdownContent
<MarkdownContent content={post.content} dark={dark} />

// Toolbar
<ArticleToolbar
  fontSize={fontSize}
  dark={dark}
  onInc={incFontSize}
  onDec={decFontSize}
  onToggleDark={toggleDark}
/>
```

---

## Out of Scope

- 全站 dark mode（未來可擴充）
- 滑動動畫
- 系統 `prefers-color-scheme` 自動跟隨
- 四檔以上字級
