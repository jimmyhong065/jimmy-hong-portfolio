# Theme Modularization Design

**Date:** 2026-06-06
**Goal:** Allow each forked client deployment to customize brand appearance and page visibility from the admin panel — no code changes required.

---

## Overview

Each client gets a forked repo deployed independently. The admin panel exposes three no-code controls: accent color, font family, and page visibility toggles. Settings persist in the existing Supabase `settings` table and apply at runtime via CSS custom properties — changes take effect immediately without redeploy.

---

## Data Layer

Extend the existing `settings` table (row id=1) with three new columns:

| Column | Type | Default | Example |
|--------|------|---------|---------|
| `accent_color` | `text` | `#111827` | `"#3b82f6"` |
| `font_family` | `text` | `Noto Sans TC` | `"Inter"` |
| `hidden_pages` | `text[]` | `{}` | `["faq", "photo", "services"]` |

Migration:
```sql
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Noto Sans TC',
  ADD COLUMN IF NOT EXISTS hidden_pages text[] DEFAULT '{}';
```

---

## Theme Loading

App startup (`App.jsx`) fetches settings once and applies the theme before render:

### CSS Variables injected into `:root`

| Variable | Derivation |
|----------|------------|
| `--color-accent` | accent_color raw value |
| `--color-accent-hover` | accent_color darkened 15% |
| `--color-accent-light` | accent_color lightened to 95% brightness |
| `--color-accent-text` | `#fff` or `#111` based on WCAG contrast ratio |

Color math uses `tinycolor2` (small, tree-shakeable). No new build dependency needed beyond what's already in the project.

### Font Loading

Inject `<link>` tag into `<head>` dynamically:
```js
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;500;700&display=swap`
document.head.appendChild(link)
document.documentElement.style.setProperty('--font-body', `"${fontFamily}", sans-serif`)
```

### Existing Component Updates

All accent-color usages currently hardcoded as `gray-900` / `blue-500` etc. are replaced with `var(--color-accent)`. This is a targeted find-and-replace in components that use brand color (Nav active state, buttons, links, progress bar).

---

## Page Visibility

`hidden_pages` array lists page slugs to suppress. Two enforcement points:

1. **Nav** — `Nav.jsx` filters out hidden pages from the tab list
2. **Routes** — `App.jsx` wraps hidden routes in a redirect to `/` using a `HiddenRoute` wrapper component

Controllable pages: `blog`, `projects`, `services`, `faq`, `photo`, `about`

Settings are fetched once at boot and stored in a `SiteSettingsContext` (React context), accessible by Nav and App without prop drilling.

---

## Admin UI

New section added to `AdminSettings.jsx`: **外觀設定**

### Accent Color
- `<input type="color">` with live preview
- Hex value shown alongside the picker
- On change: immediately updates CSS variables (live preview before save)
- On save: persists to Supabase

### Font Family
Dropdown with 8 options:
- Noto Sans TC（預設）
- Noto Serif TC
- Inter
- Roboto
- Lato
- Merriweather
- Playfair Display
- Source Code Pro

On change: immediately swaps font on page (live preview).

### Page Visibility
Toggle list — one switch per page:

| Page | Label |
|------|-------|
| `blog` | 部落格 |
| `projects` | 作品集 |
| `services` | 服務 |
| `faq` | FAQ |
| `photo` | 攝影 |
| `about` | 關於 |

Single save button at the bottom of the 外觀設定 section submits all three settings together.

---

## Architecture

```
App.jsx
  └── fetchSettings() on mount
        ├── injectCSSVariables(accent_color)   → :root CSS vars
        ├── injectGoogleFont(font_family)       → <head> <link>
        └── SiteSettingsContext.Provider
              ├── Nav.jsx          reads hidden_pages → filters tabs
              ├── HiddenRoute      reads hidden_pages → redirects
              └── AdminSettings    reads/writes all three fields
```

---

## Implementation Scope

**New files:**
- `src/lib/theme.js` — color derivation + CSS variable injection + font injection
- `src/contexts/SiteSettingsContext.jsx` — React context for settings

**Modified files:**
- `src/App.jsx` — fetch settings on mount, wrap hidden routes
- `src/components/Nav.jsx` — filter tabs by hidden_pages
- `src/pages/admin/AdminSettings.jsx` — add 外觀設定 section
- Supabase migration SQL (run manually)

**Components with accent color replacements:**
- `Nav.jsx` (active tab indicator)
- `BlogPost.jsx` (reading progress bar)
- `ArticleToolbar.jsx` (active states)
- Any other components using hardcoded brand color

---

## Out of Scope

- Multiple color palettes or preset themes
- Per-page custom colors
- Dark mode theming (existing dark mode is reader preference, not brand)
- Logo upload (already handled by existing avatar_url in settings)
