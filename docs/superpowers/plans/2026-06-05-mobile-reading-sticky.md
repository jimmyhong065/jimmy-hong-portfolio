# Mobile Reading Stickiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升手機閱讀黏著度：prose 行距、ArticleToolbar 進度感知、RelatedPosts emoji。

**Architecture:** 3 個獨立改動——CSS 一行、ArticleToolbar 加 props、RelatedPosts 加 emoji map。`RelatedPosts` 已存在且已正確放置，只需增強。

**Tech Stack:** React, Tailwind CSS, Supabase (已有)

---

## File Map

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/styles/index.css` | Modify | 加 prose 行距 |
| `src/components/ArticleToolbar.jsx` | Modify | 加 `progress`/`readingMin` props + 進度條 + 剩餘時間 |
| `src/pages/BlogPost.jsx` | Modify | 傳新 props 給 ArticleToolbar |
| `src/components/RelatedPosts.jsx` | Modify | 加 emoji mapping |

---

## Task 1: Prose 行距優化

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: 加行距 CSS**

在 `src/styles/index.css` 現有 `.article-font-sm .prose { font-size: 14px; }` 之後加入：

```css
/* Chinese reading line-height */
.article-font-sm .prose p,
.article-font-sm .prose li,
.article-font-sm .prose blockquote,
.article-font-md .prose p,
.article-font-md .prose li,
.article-font-md .prose blockquote,
.article-font-lg .prose p,
.article-font-lg .prose li,
.article-font-lg .prose blockquote {
  line-height: 1.85;
}
```

- [ ] **Step 2: 手動驗證**

`npm run dev` → 開文章頁 → 確認中文段落行距明顯比之前寬。

- [ ] **Step 3: Commit**

```bash
git add src/styles/index.css
git commit -m "style(article): increase prose line-height to 1.85 for Chinese readability"
```

---

## Task 2: ArticleToolbar 加進度條 + 剩餘時間

**Files:**
- Modify: `src/components/ArticleToolbar.jsx`
- Modify: `src/pages/BlogPost.jsx`

### 2a: 更新 ArticleToolbar

- [ ] **Step 1: 加 `progress` + `readingMin` props，加進度條和剩餘時間 label**

將 `src/components/ArticleToolbar.jsx` 完整替換為：

```jsx
const FONT_LABELS = { sm: '14px', md: '16px', lg: '18px' }

function remainingLabel(progress, readingMin) {
  if (!readingMin) return FONT_LABELS['md']
  if (progress === 0) return `${readingMin} 分鐘`
  if (progress >= 100) return '讀完了 ✓'
  return `剩 ${Math.ceil(readingMin * (1 - progress / 100))} 分鐘`
}

export default function ArticleToolbar({ fontSize, dark, onInc, onDec, onToggleDark, bookmarked = false, onToggleBookmark = () => {}, progress = 0, readingMin = 0 }) {
  const barColor = dark ? '#9ca3af' : '#111827'
  const barBg = dark ? '#374151' : '#e5e7eb'

  return (
    <div
      className="fixed left-0 right-0 lg:hidden z-40 border-t shadow-sm"
      style={{
        bottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
        ...(dark
          ? { backgroundColor: '#1e1e1e', borderColor: '#333' }
          : { backgroundColor: '#ffffff', borderColor: '#f3f4f6' }),
      }}
    >
      {/* Progress bar */}
      <div style={{ height: '2px', background: barBg, borderRadius: 0 }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: barColor,
            transition: 'width 0.2s ease',
          }}
        />
      </div>

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
            className="text-xs w-14 text-center tabular-nums"
            style={{ color: dark ? '#6b7280' : '#9ca3af' }}
          >
            {remainingLabel(progress, readingMin)}
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
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleBookmark}
            className="text-lg leading-none"
            style={{ color: bookmarked ? (dark ? '#e5e7eb' : '#111827') : (dark ? '#6b7280' : '#d1d5db') }}
            aria-label={bookmarked ? '取消收藏' : '加入收藏'}
          >
            {bookmarked ? '★' : '☆'}
          </button>
          <button
            onClick={onToggleDark}
            className="text-lg leading-none"
            aria-label={dark ? '切換亮色模式' : '切換暗色模式'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 更新 BlogPost.jsx 傳入新 props**

找到 `src/pages/BlogPost.jsx` 中的 `<ArticleToolbar` 區塊（約 449 行），加入 `progress` 和 `readingMin`：

```jsx
<ArticleToolbar
  fontSize={fontSize}
  dark={dark}
  onInc={incFontSize}
  onDec={decFontSize}
  onToggleDark={toggleDark}
  progress={progress}
  readingMin={readingMin}
  bookmarked={isBookmarked}
  onToggleBookmark={toggleBookmark}
/>
```

- [ ] **Step 3: 手動驗證**

`npm run dev` → 手機尺寸 → 開文章頁 → 捲動，確認：
- toolbar 上方出現進度條隨捲動增長
- label 從「X 分鐘」→「剩 Y 分鐘」→「讀完了 ✓」

- [ ] **Step 4: Commit**

```bash
git add src/components/ArticleToolbar.jsx src/pages/BlogPost.jsx
git commit -m "feat(toolbar): add reading progress bar and remaining time to ArticleToolbar"
```

---

## Task 3: RelatedPosts Emoji

**Files:**
- Modify: `src/components/RelatedPosts.jsx`

- [ ] **Step 1: 加 emoji map + 更新 UI**

將 `src/components/RelatedPosts.jsx` 完整替換為：

```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TAG_EMOJI = [
  [['CI/CD', 'Actions', 'GitHub', 'github'], '⚙️'],
  [['Appium', '行動', 'mobile', 'Mobile'], '📱'],
  [['pytest', 'Python', 'BDD'], '🐍'],
  [['k6', '效能', 'performance', 'Performance'], '⚡'],
  [['測試工具', '測試框架', 'Playwright', 'Selenium'], '🧪'],
  [['職涯', '軟技能', '溝通', '協作'], '💼'],
  [['AI', 'LLM', '人工智慧'], '🤖'],
]

function getEmoji(tags = []) {
  for (const [keywords, emoji] of TAG_EMOJI) {
    if (tags.some(t => keywords.some(k => t.includes(k)))) return emoji
  }
  return '📄'
}

export default function RelatedPosts({ currentSlug, tags }) {
  const [related, setRelated] = useState([])

  useEffect(() => {
    if (!tags?.length) return
    supabase
      .from('posts')
      .select('id, title, slug, tags, excerpt')
      .eq('published', true)
      .neq('slug', currentSlug)
      .then(({ data }) => {
        if (!data) return
        const scored = data
          .map(p => ({
            ...p,
            score: (p.tags ?? []).filter(t => tags.includes(t)).length,
          }))
          .filter(p => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
        setRelated(scored)
      })
  }, [currentSlug, tags])

  if (!related.length) return null

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="text-sm font-semibold mb-4 text-gray-700">你可能也感興趣</h2>
      <div className="flex flex-col gap-3">
        {related.map(p => (
          <Link
            key={p.id}
            to={`/blog/${p.slug}`}
            className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors"
          >
            <span className="text-xl leading-none mt-0.5 flex-shrink-0">{getEmoji(p.tags)}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium line-clamp-2 text-gray-900 mb-1">{p.title}</p>
              <div className="flex gap-1 flex-wrap">
                {(p.tags ?? []).slice(0, 2).map(t => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 手動驗證**

`npm run dev` → 開有 tags 的文章 → 捲到底 → 確認：
- 相關文章區塊顯示「你可能也感興趣」
- 每篇有對應 emoji
- 點擊可跳轉

- [ ] **Step 3: Commit**

```bash
git add src/components/RelatedPosts.jsx
git commit -m "feat(related): add emoji mapping and vertical list layout to RelatedPosts"
```

---

## 完成後驗收

- [ ] 手機尺寸（375px）捲動文章，行距舒適
- [ ] Toolbar 進度條與剩餘時間隨捲動更新
- [ ] 文章結尾顯示相關文章（有 emoji）
- [ ] 桌機版不受影響（toolbar `lg:hidden`，RelatedPosts 在桌機也正常顯示）
- [ ] Dark mode 下進度條顏色正確
