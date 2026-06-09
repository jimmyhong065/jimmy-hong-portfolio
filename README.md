# Jimmy Hong Portfolio

QA-focused personal site and content CMS for `qa-lens.com`. The app combines a public portfolio/blog, photography portfolio, subscription flows, push notifications, and an authenticated admin area.

## Stack

- React 18 + Vite
- React Router
- Tailwind CSS
- Supabase Auth, Postgres, and RLS
- Cloudflare Pages Functions
- Cloudflare R2 for image uploads
- Brevo SMTP API for email delivery
- Vitest + Testing Library

## App Structure

- `src/App.jsx` defines public routes and protected admin routes.
- `src/pages/` contains public pages such as home, blog, projects, FAQ, saved articles, notifications, and photography pages.
- `src/pages/admin/` contains CMS screens for posts, projects, services, FAQ, announcements, subscribers, submissions, images, and site settings.
- `src/components/` contains shared navigation, content rendering, editors, cards, SEO, and reading UI.
- `src/hooks/` contains Supabase-backed data hooks plus local reading/bookmark/push behavior.
- `functions/` contains Cloudflare Pages Functions for email, push, uploads, R2 management, RSS, and sitemap endpoints.
- `supabase/schema.sql` documents the database schema and RLS policies expected by the app.

## Local Setup

Install dependencies:

```sh
npm install
```

Create `.env.local` with the client-side values needed by Vite:

```sh
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=
VITE_UPLOAD_SECRET=
VITE_PUSH_SECRET=
```

For deployed Cloudflare Pages Functions, configure these environment variables and bindings:

```sh
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ADMIN_EMAIL=
SITE_URL=
UPLOAD_SECRET=
PUSH_SECRET=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY_JWK=
VAPID_SUBJECT=
BREVO_API_KEY=
BREVO_FROM=
R2_PUBLIC_URL=
PHOTO_BUCKET=<R2 binding>
```

Run the development server:

```sh
npm run dev
```

## Scripts

- `npm run dev` starts Vite with HMR.
- `npm run build` regenerates `public/sitemap.xml` and builds the app.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest in watch mode.
- `npm run test:run` runs the full test suite once.

## Data Model

The main Supabase tables are:

- `posts`: blog content, slug routing, publishing state, tags, excerpts, and article body.
- `projects`: QA portfolio projects, images, external links, tags, and display ordering.
- `photo_projects`: photography portfolio projects and galleries.
- `settings`: singleton site settings row, including theme, SEO, navigation tabs, hero copy, and visibility flags.
- `services`: QA/photo service offerings.
- `announcements`: active homepage announcements.
- `faqs`: public FAQ entries.
- `faq_submissions`: public inquiry form submissions.
- `email_subscribers`: email subscription records managed through service-role functions.
- `push_subscriptions`: browser push endpoints managed through service-role functions.
- `notifications`: notification history shown in the public notifications page.

Run or copy `supabase/schema.sql` into Supabase SQL Editor when creating a fresh environment. If the production database already exists, review each statement before applying because the file is intended as source-of-truth documentation and bootstrap SQL.

## Content Workflows

- Public reads use Supabase anon access guarded by RLS policies.
- Admin pages require Supabase Auth and authenticated RLS policies.
- Subscriber list and broadcast APIs verify the current Supabase user against `ADMIN_EMAIL`.
- Image uploads require `UPLOAD_SECRET` and write to the `PHOTO_BUCKET` R2 binding.
- Push and email broadcast endpoints require `PUSH_SECRET` or an authenticated admin session, depending on endpoint.

## Notes

- `npm run build` can generate a static-only sitemap when Supabase credentials are unavailable.
- `public/sw.js` handles web push notification display and click navigation.
- Local browser-only state is used for saved articles, read history, article preferences, and read notification ids.
