# Photography Domain — Design Spec

**Date:** 2026-05-17
**Author:** Jimmy Hong
**Status:** Approved

---

## 1. Purpose

Add a photography portfolio domain to the existing QA portfolio site. Jimmy Hong operates a photography studio under the brand **r.bing recording** (`@r.bing_recording` on Instagram). The site becomes a dual-domain personal brand: QA Engineer + Photography Studio, managed from the same admin backend.

---

## 2. Scope

**In scope:**
- New photography pages at `/photo` and `/photo/:id`
- Independent `PhotoNav` for the photography domain
- `photo_projects` Supabase table with image gallery support
- Admin management for photography projects
- R2 image hosting (manual upload via Cloudflare Dashboard, paste URL into admin)

**Out of scope:**
- Photography blog/articles (photography domain has no blog)
- Direct image upload from admin UI (v1: paste URL manually)
- Separate photography settings (reuses existing `settings` table)

---

## 3. Information Architecture

```
/                    QA 首頁（現有，不動）
/projects            QA 作品集（現有）
/projects/:id        QA 作品詳情（現有）
/blog                QA 部落格（現有）
/blog/:slug          QA 文章（現有）
/about               關於我（現有，兩個領域共用）
/login               登入（現有）
/admin               後台（現有，擴充攝影管理）

/photo               攝影首頁 — Hero + 作品 grid + Services
/photo/:id           攝影作品詳情 — Image gallery + Markdown 內文
```

---

## 4. Brand

- **Studio name:** r.bing recording
- **Instagram:** https://www.instagram.com/r.bing_recording/
- **Visual style:** 沿用極簡白風格，與 QA 站一致

---

## 5. PhotoNav

Independent navigation for `/photo/*` pages.

**Layout:**
- Left: `r.bing recording` (text logo, links to `/photo`)
- Center: `作品集` (→ `/photo`)
- Right: Instagram icon link + `QA 網站` text link (→ `/`) + 聯絡 CTA (from `settings.email`)

**Behavior:** Used only on `/photo` and `/photo/:id`. QA pages continue to use the existing `Nav` component.

---

## 6. Pages

### `/photo` — PhotoHome

- **Hero:** 個人照（`settings.avatar_url`）+ studio name + 定位句 + bio + CTA（聯絡我）+ Instagram 連結
  - Tagline placeholder: `用鏡頭記錄真實的瞬間`
  - Bio placeholder: `專注人像與生活紀錄攝影。每一張照片都是一個故事的開始。`
- **作品 grid:** All photo projects ordered by `display_order ASC`. Each card shows `cover_url`, title, and tags.
- **Services:** 3 hardcoded service cards (placeholder，Jimmy 確認後更新):
  1. **人像攝影** — 個人形象照、畢業照、情侶寫真
  2. **活動紀錄** — 演唱會、展覽、品牌活動現場攝影
  3. **商業攝影** — 商品拍攝、品牌視覺、空間攝影

### `/photo/:id` — PhotoDetail

- **Image gallery:** Grid of all `images[]` URLs for this project
- **Title + tags**
- **Markdown 內文:** Full `content` rendered via existing `MarkdownContent` component
- **Back link:** ← 返回作品集

---

## 7. Database Schema

```sql
CREATE TABLE photo_projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  content       text,           -- Markdown 拍攝說明/故事
  cover_url     text,           -- 列表封面圖 URL
  images        text[],         -- Gallery 圖片 URL 陣列
  tags          text[],         -- 分類標籤（人像/風景/商業等）
  display_order int DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE photo_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read photo_projects"
  ON photo_projects FOR SELECT USING (true);

CREATE POLICY "auth all photo_projects"
  ON photo_projects FOR ALL USING (auth.role() = 'authenticated');
```

**Image hosting:** Photos uploaded manually to Cloudflare R2 bucket (public read). Public URL pasted into admin form — one URL per line in `images` textarea, stored as `text[]`.

---

## 8. File Structure

```
src/
├── components/
│   └── PhotoNav.jsx                  # 攝影獨立導覽列
├── hooks/
│   └── usePhotoProjects.js           # fetch photo_projects, filter by tag
├── pages/photo/
│   ├── PhotoHome.jsx                 # Hero + grid + Services
│   └── PhotoDetail.jsx               # Gallery + Markdown
└── pages/admin/
    ├── AdminPhotoProjects.jsx         # 列表 + 刪除
    └── AdminPhotoProjectEdit.jsx      # 新增/編輯表單
```

**Modified files:**
- `src/App.jsx` — add `/photo` and `/photo/:id` routes, admin photo routes
- `src/pages/admin/AdminLayout.jsx` — add 攝影作品 sidebar link

---

## 9. Admin Interface

**攝影作品管理 (`/admin/photo-projects`)**
- Table: title, tags, display_order, 編輯/刪除
- 新增/編輯 form fields:
  - `title` (text)
  - `description` (text, short)
  - `content` (Markdown textarea)
  - `cover_url` (text, single URL)
  - `images` (textarea, one URL per line → stored as `text[]`)
  - `tags` (comma-separated → stored as `text[]`)
  - `display_order` (number)

**AdminLayout sidebar additions:**
```
文章管理
作品集管理
攝影作品        ← new
個人設定
```

---

## 10. Hook

```js
// src/hooks/usePhotoProjects.js
export function usePhotoProjects(tag = null) {
  // same cancellation-guard pattern as useProjects
  // select all columns from photo_projects
  // filter by tag if provided (contains)
  // order by display_order ASC
  return { projects, loading, error }
}
```

---

## 11. SEO

- `/photo` — title: `r.bing recording | 攝影作品集`
- `/photo/:id` — title: `{project.title} | r.bing recording`
- Uses existing `SEOHead` component

---

## 12. Routing

```jsx
// App.jsx additions
<Route path="/photo" element={<PhotoHome />} />
<Route path="/photo/:id" element={<PhotoDetail />} />

// Inside /admin nested routes
<Route path="photo-projects" element={<AdminPhotoProjects />} />
<Route path="photo-projects/:id" element={<AdminPhotoProjectEdit />} />
```

---

## 13. Out of Scope (v1)

- Photography blog/articles
- Direct R2 upload from admin UI
- Photography-specific settings (contact email reused from global `settings` table)
- Tag filter bar on `/photo` (add later when enough projects exist)
