# Photography Domain Redesign — Design Spec

**Date:** 2026-05-17
**Author:** Jimmy Hong
**Status:** Approved

---

## 1. Purpose

Redesign the photography domain (`/photo`) to match an editorial, image-forward aesthetic inspired by annawolf.com — centered brand nav, masonry photo grid, minimized hero.

---

## 2. Reference

- **Inspiration:** https://www.annawolf.com/travel
- **Key traits:** Brand name centered in nav, no hero text block, photography-first masonry grid, clean whitespace

---

## 3. Files Modified

- `src/components/PhotoNav.jsx`
- `src/pages/photo/PhotoHome.jsx`
- `src/components/PhotoCard.jsx`
- `src/pages/photo/PhotoDetail.jsx`

No new files. No database changes.

---

## 4. PhotoNav

**Layout:** 3-column grid (`grid grid-cols-3`)

```
[作品集]  [Instagram]  |  r.bing recording  |  [聯絡我]  [QA 網站]
```

- Left cell (left-aligned): `作品集` link (→ `/photo`), `Instagram` link (→ instagram)
- Center cell (center-aligned): brand name `r.bing recording`, `text-xl font-bold tracking-widest`
- Right cell (right-aligned): `聯絡我` mailto CTA (conditional on `settings.email`), `QA 網站` link (→ `/`)
- Sticky top, white background, bottom border — same as current

---

## 5. PhotoHome

### Hero (minimized)

Horizontal layout, `py-10` (was `py-20`):

- Avatar: `w-12 h-12` circle (was `w-24 h-24`)
- Right of avatar: brand name `text-lg font-bold`, tagline `text-sm text-gray-500`
- Below tagline: `預約洽詢` button + Instagram icon — same as current but inline
- **Removed:** bio long text, "Photography Studio" label

### Gallery

- No section header (remove "Portfolio / 攝影作品" label + h2)
- `columns-3 gap-4` CSS masonry
- Break-inside: `[&>*]:break-inside-avoid [&>*]:mb-4`
- Each `PhotoCard` renders naturally (no fixed height container)

### Services

- Kept as-is, `mt-16` spacing
- Retain small "Services" heading and 3 cards

---

## 6. PhotoCard

- Remove `aspect-[4/3]` fixed ratio from the image
- Use `w-full h-auto object-cover` — image renders at natural height
- Remove `rounded-xl border` card wrapper → borderless, just the image + text below
- Text area: title (`text-sm font-semibold`) + tags, `pt-2 pb-4`
- No card border, no hover shadow — cleaner gallery feel

---

## 7. PhotoDetail — Image Gallery

Replace current 2-col fixed-aspect grid with masonry:

```jsx
<div className="columns-2 gap-3 mb-10">
  {project.images.map((url, i) => (
    <img
      key={i}
      src={url}
      alt={`${project.title} ${i + 1}`}
      className="w-full h-auto mb-3 rounded-sm"
    />
  ))}
</div>
```

- No `aspect-[4/3]`, no `border border-gray-100`
- `rounded-sm` instead of `rounded-xl` — more editorial feel
- Rest of page unchanged (tags, title, markdown, back link)

---

## 8. Out of Scope

- Mobile responsive breakpoints (keep existing behavior)
- Lightbox / fullscreen image view
- Tag filter on `/photo`
- Any backend / data changes
