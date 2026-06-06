# Preset Themes + Section Visibility Design

**Date:** 2026-06-06
**Goal:** Non-technical clients can pick a preset theme with one click and toggle which Home page sections appear — no code changes required.

---

## Overview

Two capabilities added to the existing theme modularization system:

1. **Preset Themes** — 5 pre-defined visual combinations (accent color + font + background color). Clicking a preset pre-fills the existing admin form fields and applies a live preview. The user can further adjust any field manually after selecting a preset.

2. **Home Section Visibility** — 4 toggles controlling which sections render on the Home page. Complements the existing page-level `hidden_pages` control.

---

## Data Layer

Extend the `settings` table (row id=1) with two new columns:

| Column | Type | Default | Example |
|--------|------|---------|---------|
| `bg_color` | `text` | `#ffffff` | `"#0f172a"` |
| `hidden_sections` | `text[]` | `{}` | `["dual_identity","services"]` |

Migration:
```sql
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS bg_color        text    DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS hidden_sections text[]  DEFAULT '{}';
```

---

## Presets

Hardcoded in the frontend (`src/lib/presets.js`) — no DB required. Each preset is a plain object:

```js
export const PRESETS = [
  { id: 'minimal', name: 'Minimal', accent_color: '#111827', font_family: 'Noto Sans TC',      bg_color: '#ffffff' },
  { id: 'ocean',   name: 'Ocean',   accent_color: '#2563eb', font_family: 'Inter',              bg_color: '#ffffff' },
  { id: 'bold',    name: 'Bold',    accent_color: '#7c3aed', font_family: 'Playfair Display',   bg_color: '#ffffff' },
  { id: 'warm',    name: 'Warm',    accent_color: '#d97706', font_family: 'Lato',               bg_color: '#fafaf9' },
  { id: 'dark',    name: 'Dark',    accent_color: '#38bdf8', font_family: 'Inter',              bg_color: '#0f172a' },
]
```

**Preset selection flow:**
1. Admin clicks a preset card in AdminSettings
2. Form fields (`accent_color`, `font_family`, `bg_color`) are overwritten with preset values
3. `applyTheme()` is called immediately for live preview
4. Admin can still manually adjust any field before saving
5. On save, the individual field values are stored (not the preset ID — no lock-in)

---

## Theme Application

### CSS Variables

`applyTheme()` in `src/lib/theme.js` is extended to accept and apply `bg_color`:

| CSS Variable | Source |
|---|---|
| `--color-accent` | `accent_color` |
| `--color-accent-hover` | `accent_color` darkened 15% |
| `--color-accent-light` | `accent_color` lightened + alpha |
| `--color-accent-text` | WCAG contrast on accent |
| `--color-bg` | `bg_color` |
| `--color-text-primary` | derived from `bg_color` contrast (`#f1f5f9` if bg is dark, `#111827` if light) |
| `--font-body` | `font_family` |

### Body Background

`applyTheme()` sets `document.body.style.backgroundColor` to `var(--color-bg)` so the Dark preset produces a dark page background immediately.

**Scope note:** `--color-text-primary` is defined but individual component text colors (Tailwind `text-gray-*` classes) are not replaced in Sub-project A. Full dark-mode text inversion is Sub-project B. The Dark preset provides a dark background + blue accent + correct nav/button colors; body text color follows inherited body style.

---

## Home Section Visibility

### Controllable Sections

| Key | Section | Location in Home.jsx |
|-----|---------|----------------------|
| `dual_identity` | 雙身份介紹 | `{/* ── Dual identity ── */}` |
| `featured_projects` | 精選作品 | `{/* ── Featured projects ── */}` |
| `recent_posts` | 最新文章 | `{/* ── Recent posts ── */}` |
| `services` | 服務區塊 | `{/* ── Services ── */}` |

Hero section is always visible and not controllable.

### Implementation

`Home.jsx` reads `hidden_sections` from `useSiteSettings()` and wraps each section:

```jsx
const { settings } = useSiteSettings()
const hiddenSections = settings.hidden_sections ?? []

{!hiddenSections.includes('dual_identity') && (
  <section>...</section>
)}
```

---

## SiteSettingsContext

`DEFAULT_SETTINGS` extended:

```js
const DEFAULT_SETTINGS = {
  // existing fields...
  bg_color: '#ffffff',
  hidden_sections: [],
}
```

`applyTheme` call in the provider now includes `bg_color`:

```js
applyTheme({ accent_color: data.accent_color, font_family: data.font_family, bg_color: data.bg_color })
```

---

## Admin UI

`AdminSettings.jsx` — 外觀設定 section restructured:

### 1. Preset 快速套用 (new — top of section)

5 clickable cards in a horizontal scroll row. Each card shows:
- Color swatch (accent color)
- Preset name
- Font name

Clicking a card:
1. Updates local form state (`accent_color`, `font_family`, `bg_color`)
2. Calls `applyTheme()` for immediate live preview
3. Does NOT auto-save — user still clicks 儲存

### 2. 品牌主色 (existing)
Color picker for `accent_color`.

### 3. 背景色 (new)
Color picker for `bg_color`. Same pattern as accent color picker.

### 4. 字型 (existing)
Dropdown for `font_family`.

### 5. 頁面顯示 (existing)
Checkboxes for `hidden_pages`.

### 6. 首頁 Section 顯示 (new)
4 checkboxes mapped to `hidden_sections` array:

| Checkbox label | Key |
|---|---|
| 雙身份介紹 | `dual_identity` |
| 精選作品 | `featured_projects` |
| 最新文章 | `recent_posts` |
| 服務區塊 | `services` |

Checked = visible, unchecked = hidden (inverted from `hidden_sections` — if key is NOT in array, it shows).

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/presets.js` | `PRESETS` array — preset definitions |

## Modified Files

| File | Changes |
|------|---------|
| `src/lib/theme.js` | Add `bg_color` param to `applyTheme`, set `--color-bg` + `--color-text-primary` + body bg |
| `src/lib/__tests__/theme.test.js` | Add tests for `bg_color` handling |
| `src/contexts/SiteSettingsContext.jsx` | Add `bg_color`, `hidden_sections` to DEFAULT_SETTINGS; pass `bg_color` to `applyTheme` |
| `src/pages/Home.jsx` | Read `hidden_sections`, wrap 4 sections with conditional render |
| `src/pages/admin/AdminSettings.jsx` | Add preset cards, bg_color picker, hidden_sections checkboxes |

---

## Out of Scope (Sub-project B)

- `surface_color` for card backgrounds
- Full dark-mode text inversion (replacing Tailwind text classes with CSS vars)
- `--color-text-primary` applied to individual components
