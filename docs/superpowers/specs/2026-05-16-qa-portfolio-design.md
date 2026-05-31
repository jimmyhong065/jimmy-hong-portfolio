# QA Portfolio & Blog — Design Spec

**Date:** 2026-05-16  
**Author:** Jimmy Hong  
**Status:** Approved

---

## 1. Purpose

Build a personal portfolio and blog site to establish Jimmy Hong's professional brand as a QA Engineer specializing in **QA 流程與系統設計**. Goals:

- Showcase QA projects demonstrating concrete business impact
- Publish technical articles to accumulate SEO equity and community presence
- Signal availability for consulting (QA 流程顧問, 自動化導入)
- Serve as a long-term career asset, not a one-off resume page

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Vite + React 18 | User requirement |
| Routing | React Router v6 | Multi-page SPA |
| Styling | Tailwind CSS | Utility-first, fast iteration, minimal output |
| Auth & DB | Supabase | Managed Postgres + Row-Level Security + Magic Link auth |
| SEO | react-helmet-async | Per-page `<title>` + `<meta>` + Open Graph |
| Markdown | react-markdown + remark-gfm | Render post/project content stored in Supabase |
| Hosting | Cloudflare Pages | Free static hosting, global CDN, zero-config deploy |

---

## 3. Information Architecture

```
/                   首頁 — Hero + 精選作品(3) + 近期文章(3) + Services
/projects           作品集列表 — filter by tag
/projects/:id       作品詳情 — Markdown content + tags + links
/blog               文章列表 — filter by tag
/blog/:slug         單篇文章 — Markdown + OG meta + 分享按鈕
/about              關於我 — 個人故事 + 技能 + 工作經歷
/login              Email magic link 登入（僅管理員用）
/admin              後台 dashboard（需 Supabase auth session）
/admin/posts        文章 CRUD — 新增/編輯/刪除/發布
/admin/projects     作品集 CRUD — 新增/編輯/刪除/排序
```

---

## 4. Visual Design

**Style:** 極簡白。大量留白、細線分隔、無裝飾色塊。

**Typography:**
- 系統字體：`-apple-system, BlinkMacSystemFont, 'Segoe UI'`
- 標題：`font-weight: 700`, 文字色 `#111`
- 輔助文字：`#555` / `#888` / `#999`

**Spacing:** 8px base unit，section padding `64px`，nav padding `20px 48px`

**Components:**
- Nav：logo 左、連結中、CTA 右（黑底白字按鈕）
- Hero：左側圓形個人照片 + 姓名 + 定位句 + bio + tags + CTA；右側 Services card
- Project card：封面區 + 標題 + 描述 + tags，hover shadow
- Blog row：日期 + 標題 + tags，底線分隔
- Admin：左側 sidebar + 右側 table（草稿/已發布 badge）

---

## 5. Hero Section

```
[圓形照片 96px]  Jimmy Hong
                 QA Engineer / 品質架構師
                 打造讓團隊信任的 QA 系統

                 專注測試流程設計與品質架構。
                 從流程標準化到自動化導入，
                 讓品質成為開發文化，而不是最後一道關卡。

                 [測試策略] [CI/CD 整合] [自動化框架] [QA 流程設計]

                 [看作品集]  閱讀文章  [gh] [in] [✉]
```

右欄：Services card（QA 流程審查、自動化導入、測試策略規劃、品質指標設計）+ 數字統計

---

## 6. Database Schema

```sql
-- 部落格文章
CREATE TABLE posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  slug         text UNIQUE NOT NULL,
  content      text,           -- Markdown
  excerpt      text,
  tags         text[],
  published    boolean DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- QA 作品集
CREATE TABLE projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  content       text,           -- Markdown
  tags          text[],
  cover_url     text,
  links         jsonb,          -- { github, demo, report }
  display_order int DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);
```

**Row Level Security:**
- `posts`: `SELECT` allowed where `published = true` (anon); all ops allowed for authenticated user
- `projects`: `SELECT` always allowed (anon); write ops require auth

---

## 7. Authentication

- Provider: Supabase Magic Link (Email OTP)
- Only one user (Jimmy Hong) — no public registration
- Auth guard: React component wrapping `/admin/*` routes, redirects to `/login` if no session
- Session stored in Supabase JS client (localStorage)

---

## 8. SEO & Personal Branding

| Feature | Implementation |
|---|---|
| Per-page title + description | `react-helmet-async` on every route |
| Open Graph tags | `og:title`, `og:description`, `og:image` on blog posts |
| Semantic slugs | `/blog/how-i-design-qa-systems` |
| Share buttons | LinkedIn + X (Twitter) on each blog post |
| Sitemap | Static `sitemap.xml` generated at build time |
| Consistent identity | Same name + tagline across nav, hero, OG, footer |

---

## 9. Admin Interface

**文章管理 (`/admin/posts`)**
- Table: title, tags, status (草稿/已發布 badge), published_at, 編輯/刪除
- 新增/編輯 form: title, slug (auto-generated from title), content (Markdown textarea), excerpt, tags, published toggle

**作品集管理 (`/admin/projects`)**
- Table: title, tags, display_order, 編輯/刪除
- 新增/編輯 form: title, description, content, tags, cover_url, links (github/demo), display_order

---

## 10. Services Section

Three service cards on home page and `/about`:

1. **QA 流程審查** — 針對現有測試流程進行健診，找出瓶頸與缺口
2. **自動化導入顧問** — 協助團隊評估與導入自動化測試框架
3. **測試策略規劃** — 依產品特性設計測試金字塔與覆蓋率目標

Contact CTA: email link to a **personal email** (not work email). Set up a dedicated personal address before launch — e.g. Gmail or custom domain. Hardcoded in `/about` page.

---

## 11. Pages Detail

### `/` Home
- Hero (photo + name + tagline + bio + tags + CTAs + Services card)
- 精選作品 (3 project cards, `display_order ASC LIMIT 3`)
- 近期文章 (3 blog rows, `published_at DESC LIMIT 3`)
- Services (3 cards)
- Footer

### `/projects`
- Tag filter bar (derived from all project tags)
- Grid: all projects filtered by selected tag
- Each card links to `/projects/:id`

### `/projects/:id`
- Cover image (if exists)
- Title + tags + links (GitHub / Demo)
- Full Markdown content rendered via `react-markdown`

### `/blog`
- Tag filter bar
- List: all published posts, `published_at DESC`
- Each row links to `/blog/:slug`

### `/blog/:slug`
- Title + published date + tags
- Full Markdown content
- LinkedIn + X share buttons (pre-filled with post URL + title)
- OG meta tags for social preview

### `/about`
- Circular photo + name + tagline
- 個人故事 (hardcoded prose)
- 技能 tags
- 工作經歷 (hardcoded, updated manually)
- Services cards
- Contact CTA

### `/login`
- Email input → Supabase `signInWithOtp`
- Redirect to `/admin` after successful auth

### `/admin`
- Protected route (redirect to `/login` if no session)
- Sidebar: 文章管理 / 作品集管理 / 登出
- Default view: 文章管理
- Note: About page content (bio, skills, work history) is hardcoded in source — no admin UI needed for v1

---

## 12. Deployment

- **Repo:** GitHub (new repo `jimmy-hong-portfolio`)
- **CI:** Cloudflare Pages auto-deploy on `main` push
- **Build command:** `npm run build`
- **Output dir:** `dist`
- **Env vars in Cloudflare:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 13. Out of Scope (v1)

- Comments system
- Newsletter / email subscription
- Dark mode toggle
- i18n (English version)
- Analytics (add later — Cloudflare Analytics or Plausible)
- Image upload via Supabase Storage (v1: use external URLs)
