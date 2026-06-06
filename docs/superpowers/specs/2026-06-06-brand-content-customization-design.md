# Brand & Content Customization Design

**Date:** 2026-06-06
**Goal:** Allow each client deployment to customize brand identity, hero copy, card style, and heading typography from the admin panel — no code changes required.

---

## Overview

Six capabilities added to the existing theme modularization system:

1. **Brand name** — replaces hardcoded "QA Lab" (Nav) and "Jimmy Hong" (Footer)
2. **CTA button text** — replaces hardcoded "聯絡我" in Nav
3. **Heading font** — independent from body font, sets `--font-heading` CSS var
4. **Card style** — visual variant for BlogCard and ProjectCard
5. **Hero copy** — all hardcoded text in the Home hero section becomes editable
6. **Footer name** — copyright line uses `brand_name`

---

## Data Layer

Extend the `settings` table (row id=1) with 9 new columns:

```sql
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS brand_name        text     DEFAULT 'QA Lab',
  ADD COLUMN IF NOT EXISTS cta_text          text     DEFAULT '聯絡我',
  ADD COLUMN IF NOT EXISTS card_style        text     DEFAULT 'shadowed',
  ADD COLUMN IF NOT EXISTS heading_font      text     DEFAULT 'Noto Sans TC',
  ADD COLUMN IF NOT EXISTS hero_name         text     DEFAULT 'Jimmy Hong',
  ADD COLUMN IF NOT EXISTS hero_subtitle     text     DEFAULT 'QA Engineer / 品質架構師',
  ADD COLUMN IF NOT EXISTS hero_tagline      text     DEFAULT '打造讓團隊信任的 QA 系統',
  ADD COLUMN IF NOT EXISTS hero_description  text     DEFAULT '專注測試流程設計與品質架構。\n從流程標準化到自動化導入，\n讓品質成為開發文化，而不是最後一道關卡。',
  ADD COLUMN IF NOT EXISTS hero_skills       text[]   DEFAULT '{"測試策略","CI/CD 整合","自動化框架","QA 流程設計"}';
```

---

## Heading Font

### theme.js

`applyTheme()` receives a new `heading_font` parameter:

```js
export function applyTheme({ accent_color, font_family, bg_color, heading_font }) {
  // ... existing vars ...
  const hFont = heading_font ?? font_family ?? 'Noto Sans TC'
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

When `heading_font` equals `font_family`, the same font is loaded for both (no second request — browser deduplicates).

### index.css

Add one rule:

```css
h1, h2, h3, h4 {
  font-family: var(--font-heading, var(--font-body));
}
```

This applies to all headings including those inside `.prose` article content.

### SiteSettingsContext

`DEFAULT_SETTINGS` adds `heading_font: 'Noto Sans TC'`. `applyTheme` call passes `heading_font: data.heading_font`.

---

## Card Style

### Values

| value | Description | Classes applied |
|-------|-------------|-----------------|
| `shadowed` | Default (current look) | `shadow-sm hover:shadow-md` |
| `bordered` | Flat with visible border | `border border-gray-200 hover:border-gray-400` |
| `minimal` | No border, no shadow | `border-transparent shadow-none` |

### Implementation

`BlogCard` and `ProjectCard` each call `useSiteSettings()` to read `settings.card_style`, then derive a `cardClass` string:

```js
const { settings } = useSiteSettings()
const cardClass =
  settings.card_style === 'bordered' ? 'border border-gray-200 hover:border-gray-400' :
  settings.card_style === 'minimal'  ? 'border-transparent shadow-none' :
  'shadow-sm hover:shadow-md'  // shadowed default
```

The derived class replaces the currently hardcoded shadow/border classes on the card wrapper element. Background (`bg-white`) and structural classes (`rounded-xl`, `p-*`) stay on the wrapper unchanged.

---

## Brand Name & CTA Text

### Nav.jsx

- Brand link text: `{settings.brand_name ?? 'QA Lab'}`
- CTA button text: `{settings.cta_text ?? '聯絡我'}`
- Both read from `useSiteSettings()`

### Footer.jsx

- Currently hardcodes "Jimmy Hong" in copyright and name lines
- Switch to `useSiteSettings()`, replace all instances with `{settings.brand_name ?? 'Jimmy Hong'}`
- Footer navigation links filter by `hidden_pages` (same array already controlling Nav and routes)

Footer link visibility:

```jsx
const { settings } = useSiteSettings()
const hidden = settings.hidden_pages ?? []

// Only show links for visible pages:
{!hidden.includes('blog') && <Link to="/blog">部落格</Link>}
{!hidden.includes('photo') && <Link to="/photo">攝影</Link>}
{!hidden.includes('services') && <Link to="/services">合作方式</Link>}
{!hidden.includes('about') && <Link to="/about">關於我</Link>}
```

---

## Hero Copy

### Home.jsx

Replace all hardcoded hero content with settings values:

| Current hardcoded | Replaced with |
|-------------------|---------------|
| `"Jimmy Hong"` (h1, img alt) | `settings.hero_name ?? 'Jimmy Hong'` |
| `"QA Engineer / 品質架構師"` | `settings.hero_subtitle ?? 'QA Engineer / 品質架構師'` |
| `"打造讓團隊信任的 QA 系統"` | `settings.hero_tagline ?? '打造讓團隊信任的 QA 系統'` |
| 3-line description paragraph | `settings.hero_description` split by `\n`, each line rendered with `<br />` |
| `['測試策略', 'CI/CD 整合', ...]` tags | `(settings.hero_skills ?? []).map(...)` |

Description rendering:

```jsx
{(settings.hero_description ?? '').split('\n').map((line, i, arr) => (
  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
))}
```

---

## SiteSettingsContext — DEFAULT_SETTINGS

Add all 9 new fields:

```js
const DEFAULT_SETTINGS = {
  // existing fields...
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
```

`applyTheme` call updated to pass `heading_font: data.heading_font`.

---

## Admin UI — 品牌與文案 Section

New section added to `AdminSettings.jsx` above the existing 外觀設定 section.

### Fields

**品牌識別**
- `brand_name`: text input, label "品牌名稱"
- `cta_text`: text input, label "聯絡按鈕文字"

**外觀設定（existing section, additions)**
- `heading_font`: dropdown (same FONT_OPTIONS list), label "標題字型", placed after font_family dropdown
- `card_style`: radio group or select, label "卡片風格"
  - Options: 陰影卡片（shadowed）/ 框線卡片（bordered）/ 簡約無框（minimal）

**Hero 文案**
- `hero_name`: text input, label "姓名"
- `hero_subtitle`: text input, label "職稱"
- `hero_tagline`: text input, label "標語"
- `hero_description`: textarea (3 rows), label "自我介紹", hint "用換行分段"
- `hero_skills`: KeywordInput component (reuse existing SEO keyword input), label "技能標籤"

### Save

All new fields added to the existing `handleSubmit` Supabase update call. `heading_font` change also calls `applyTheme` for live preview (same pattern as `font_family`).

---

## Modified Files

| File | Changes |
|------|---------|
| `src/lib/theme.js` | Add `heading_font` param, set `--font-heading`, inject `google-font-heading` link |
| `src/lib/__tests__/theme.test.js` | Tests for heading_font behavior |
| `src/index.css` | Add `h1,h2,h3,h4 { font-family: var(--font-heading, var(--font-body)); }` |
| `src/contexts/SiteSettingsContext.jsx` | Add 9 fields to DEFAULT_SETTINGS; pass `heading_font` to `applyTheme` |
| `src/components/Nav.jsx` | `brand_name`, `cta_text` from settings |
| `src/components/Footer.jsx` | `brand_name` from settings; filter links by `hidden_pages` |
| `src/pages/Home.jsx` | Replace all hero hardcoded content with settings fields |
| `src/components/BlogCard.jsx` | `card_style` from settings |
| `src/components/ProjectCard.jsx` | `card_style` from settings |
| `src/pages/admin/AdminSettings.jsx` | New 品牌與文案 section; heading_font + card_style in 外觀設定 |

---

## Out of Scope

- Hero stats ("3+ 年 QA 經驗") — data-driven from projects/posts count, not configurable
- Desktop right panel (Services preview) — already data-driven from services DB
- Footer link labels — hardcoded page names, controlled via page visibility
