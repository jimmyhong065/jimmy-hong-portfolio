# Mobile Nav Bottom Tab Bar

**Date:** 2026-06-01  
**Scope:** Nav.jsx (QA site) + PhotoNav.jsx (Photo site)

## Problem

Both navs have no mobile breakpoints. On screens < 768px, flex/grid items wrap into multi-line text blocks, making the nav unusable.

## Solution

On mobile, hide the top nav links and replace with a fixed bottom Tab Bar (icon + text). Desktop layout unchanged.

## Breakpoint

`md` (768px). Below `md` = mobile mode.

## QA Site — Nav.jsx

### Desktop (≥ 768px)
Current layout unchanged: Logo left | nav links center | RSS + CTA right.

### Mobile (< 768px)
- **Top bar:** Logo "Jimmy Hong" only. Hide: nav links, RSS icon, 聯絡我 button.
- **Bottom Tab Bar:** 4 tabs with inline SVG icon + label.

| Tab | Route | Icon (SVG) |
|-----|-------|------------|
| 作品集 | /projects | Grid 2×2 |
| 部落格 | /blog | Document lines |
| 合作方式 | /services | Briefcase |
| 關於我 | /about | Person silhouette |

## Photo Site — PhotoNav.jsx

### Desktop (≥ 768px)
Current grid-cols-3 layout unchanged.

### Mobile (< 768px)
- **Top bar:** "r.bing recording" logo only (centered). Hide: all links.
- **Bottom Tab Bar:** 4 tabs.

| Tab | Destination | Icon (SVG) |
|-----|-------------|------------|
| 作品集 | /photo | Camera |
| Instagram | external URL | Instagram outline |
| 聯絡我 | mailto: (from settings.email) | Mail envelope |
| QA 網站 | / | External link / home |

## Component Design

### Shared pattern
Both navs get the tab bar inline (not a shared component — they have different items and different routing contexts).

### Tab Bar structure
```html
<!-- fixed bottom-0, mobile only (md:hidden) -->
<nav class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden"
     style="padding-bottom: env(safe-area-inset-bottom)">
  <ul class="grid grid-cols-4">
    <li>
      <Link class="flex flex-col items-center py-2 text-[10px]
                   [active: text-gray-900] [inactive: text-gray-400]">
        <SVGIcon />
        <span>標籤</span>
      </Link>
    </li>
  </ul>
</nav>
```

### Active state
Use `useLocation()` from react-router-dom. Tab is active when `location.pathname === route` (or `startsWith` for nested routes).

Active: `text-gray-900`  
Inactive: `text-gray-400`

### iOS safe area
`style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` — handles iPhone home indicator overlap.

### Body padding
Pages need `pb-16 md:pb-0` to prevent content hidden behind fixed tab bar on mobile.

## Icons

Inline SVG, `width="20" height="20"`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth="1.5"`.

No external icon library added.

## Files Changed

- `src/components/Nav.jsx`
- `src/components/PhotoNav.jsx`

## Out of Scope

- Admin pages (no mobile use case)
- Tablet (768px–1024px): desktop layout applies
- Reordering/changing which routes exist
