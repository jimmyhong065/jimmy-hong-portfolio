# QA Portfolio & Blog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Jimmy Hong's personal QA portfolio and blog site with Supabase backend and Cloudflare Pages hosting.

**Architecture:** Vite + React 18 SPA with React Router v6 for multi-page routing. Public visitors read posts/projects from Supabase (RLS enforced). Owner logs in via Supabase Magic Link and manages content through an `/admin` UI. All content stored as Markdown in Supabase `posts` and `projects` tables.

**Tech Stack:** Vite, React 18, React Router v6, Tailwind CSS, Supabase JS v2, react-markdown, remark-gfm, react-helmet-async, Vitest, @testing-library/react

---

## File Map

```
src/
├── main.jsx                        # React root mount
├── App.jsx                         # Router + HelmetProvider setup
├── lib/
│   └── supabase.js                 # Supabase client singleton
├── hooks/
│   ├── useAuth.js                  # session state + signOut
│   ├── usePosts.js                 # fetch published posts, filter by tag
│   └── useProjects.js              # fetch projects, filter by tag
├── components/
│   ├── Nav.jsx                     # sticky nav with links + CTA
│   ├── Footer.jsx                  # copyright + built-with line
│   ├── SEOHead.jsx                 # react-helmet-async wrapper
│   ├── MarkdownContent.jsx         # react-markdown + remark-gfm renderer
│   ├── ProjectCard.jsx             # card used in Home + /projects
│   ├── BlogRow.jsx                 # row used in Home + /blog
│   ├── TagFilter.jsx               # tag pill filter bar
│   └── ProtectedRoute.jsx          # redirects to /login if no session
├── pages/
│   ├── Home.jsx                    # Hero + featured projects + recent posts + services
│   ├── Projects.jsx                # full project list with tag filter
│   ├── ProjectDetail.jsx           # single project with markdown body
│   ├── Blog.jsx                    # full post list with tag filter
│   ├── BlogPost.jsx                # single post with markdown + share buttons
│   ├── About.jsx                   # hardcoded bio + skills + experience
│   ├── Login.jsx                   # magic link email form
│   └── admin/
│       ├── AdminLayout.jsx         # sidebar shell for /admin/*
│       ├── AdminPosts.jsx          # posts table + delete
│       ├── AdminPostEdit.jsx       # create/edit post form
│       ├── AdminProjects.jsx       # projects table + delete
│       └── AdminProjectEdit.jsx    # create/edit project form
└── styles/
    └── index.css                   # Tailwind directives
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles/index.css`

- [ ] **Step 1: Scaffold Vite + React project**

```bash
cd /Users/jimmyhong/Desktop/qa_self_blog
npm create vite@latest . -- --template react
npm install
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install react-router-dom @supabase/supabase-js react-markdown remark-gfm react-helmet-async
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Replace `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Configure Tailwind directives**

Replace `src/index.css` with `src/styles/index.css` and add:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Delete the generated `src/index.css` and `src/App.css`.

- [ ] **Step 5: Configure Vitest**

Update `vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
  },
})
```

Create `src/test-setup.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to package.json**

In `package.json`, add under `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 7: Write App.jsx with router skeleton**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/projects" element={<div>Projects</div>} />
          <Route path="/projects/:id" element={<div>ProjectDetail</div>} />
          <Route path="/blog" element={<div>Blog</div>} />
          <Route path="/blog/:slug" element={<div>BlogPost</div>} />
          <Route path="/about" element={<div>About</div>} />
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/admin/*" element={<div>Admin</div>} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}
```

- [ ] **Step 8: Update main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 9: Delete generated boilerplate**

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg src/index.css
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```
Expected: dev server at `http://localhost:5173`, browser shows "Home"

- [ ] **Step 11: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Vite + React + Tailwind + Vitest"
```

---

## Task 2: Supabase Setup

**Files:**
- Create: `src/lib/supabase.js`, `.env.local`, `supabase/schema.sql`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New Project → name it `jimmy-portfolio`. Note the project URL and anon key.

- [ ] **Step 2: Create .env.local**

```bash
touch .env.local
```

Contents:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Add `.env.local` to `.gitignore` (already there by default with Vite).

- [ ] **Step 3: Create Supabase client**

Create `src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- [ ] **Step 4: Run schema SQL in Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → New query. Paste and run:

```sql
-- Posts table
CREATE TABLE posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  slug         text UNIQUE NOT NULL,
  content      text,
  excerpt      text,
  tags         text[] DEFAULT '{}',
  published    boolean DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  content       text,
  tags          text[] DEFAULT '{}',
  cover_url     text,
  links         jsonb DEFAULT '{}',
  display_order int DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- RLS: Enable on both tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- posts: anon can read published only
CREATE POLICY "anon read published posts"
  ON posts FOR SELECT TO anon
  USING (published = true);

-- posts: authenticated user has full access
CREATE POLICY "auth full access posts"
  ON posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- projects: anon can read all
CREATE POLICY "anon read projects"
  ON projects FOR SELECT TO anon
  USING (true);

-- projects: authenticated user has full access
CREATE POLICY "auth full access projects"
  ON projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

- [ ] **Step 5: Save schema file for reference**

Create `supabase/schema.sql` with the SQL above (for documentation).

- [ ] **Step 6: Verify connection in browser console**

Temporarily add to `App.jsx` (remove after verification):
```js
import { supabase } from './lib/supabase'
console.log('Supabase:', supabase)
```
Expected: Supabase client object logged, no errors.

Remove the test import after verification.

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase.js supabase/schema.sql vite.config.js src/test-setup.js
git commit -m "feat: add Supabase client + schema"
```

---

## Task 3: Hooks — usePosts, useProjects, useAuth

**Files:**
- Create: `src/hooks/usePosts.js`, `src/hooks/useProjects.js`, `src/hooks/useAuth.js`
- Test: `src/hooks/__tests__/usePosts.test.js`, `src/hooks/__tests__/useProjects.test.js`

- [ ] **Step 1: Write failing test for usePosts**

Create `src/hooks/__tests__/usePosts.test.js`:
```js
import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '../../lib/supabase'
import { usePosts } from '../usePosts'

const mockPosts = [
  { id: '1', title: 'Post A', slug: 'post-a', tags: ['CI/CD'], published: true },
  { id: '2', title: 'Post B', slug: 'post-b', tags: ['測試策略'], published: true },
]

describe('usePosts', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
    })
  })

  it('returns all posts when no tag filter', async () => {
    const { result } = renderHook(() => usePosts())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.posts).toHaveLength(2)
  })

  it('filters posts by tag', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [mockPosts[0]],
        error: null,
      }),
    })
    const { result } = renderHook(() => usePosts('CI/CD'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.posts).toHaveLength(1)
    expect(result.current.posts[0].title).toBe('Post A')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test:run -- src/hooks/__tests__/usePosts.test.js
```
Expected: FAIL — "usePosts is not a function"

- [ ] **Step 3: Implement usePosts**

Create `src/hooks/usePosts.js`:
```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePosts(tag = null) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let query = supabase
      .from('posts')
      .select('id, title, slug, excerpt, tags, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })

    if (tag) {
      query = query.contains('tags', [tag])
    }

    query.then(({ data, error }) => {
      if (error) setError(error.message)
      else setPosts(data ?? [])
      setLoading(false)
    })
  }, [tag])

  return { posts, loading, error }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test:run -- src/hooks/__tests__/usePosts.test.js
```
Expected: PASS

- [ ] **Step 5: Write failing test for useProjects**

Create `src/hooks/__tests__/useProjects.test.js`:
```js
import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import { useProjects } from '../useProjects'

const mockProjects = [
  { id: '1', title: 'Project A', tags: ['自動化'], display_order: 0 },
  { id: '2', title: 'Project B', tags: ['流程設計'], display_order: 1 },
]

describe('useProjects', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
    })
  })

  it('returns all projects when no tag filter', async () => {
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toHaveLength(2)
  })
})
```

- [ ] **Step 6: Run test to confirm it fails**

```bash
npm run test:run -- src/hooks/__tests__/useProjects.test.js
```
Expected: FAIL

- [ ] **Step 7: Implement useProjects**

Create `src/hooks/useProjects.js`:
```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects(tag = null) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let query = supabase
      .from('projects')
      .select('id, title, description, tags, cover_url, links, display_order')
      .order('display_order', { ascending: true })

    if (tag) {
      query = query.contains('tags', [tag])
    }

    query.then(({ data, error }) => {
      if (error) setError(error.message)
      else setProjects(data ?? [])
      setLoading(false)
    })
  }, [tag])

  return { projects, loading, error }
}
```

- [ ] **Step 8: Run test to confirm it passes**

```bash
npm run test:run -- src/hooks/__tests__/useProjects.test.js
```
Expected: PASS

- [ ] **Step 9: Implement useAuth**

Create `src/hooks/useAuth.js`:
```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  return { session, loading, signOut }
}
```

- [ ] **Step 10: Commit**

```bash
git add src/hooks/
git commit -m "feat: add usePosts, useProjects, useAuth hooks with tests"
```

---

## Task 4: Core Components

**Files:**
- Create: `src/components/Nav.jsx`, `src/components/Footer.jsx`, `src/components/SEOHead.jsx`, `src/components/MarkdownContent.jsx`, `src/components/ProjectCard.jsx`, `src/components/BlogRow.jsx`, `src/components/TagFilter.jsx`, `src/components/ProtectedRoute.jsx`
- Test: `src/components/__tests__/ProtectedRoute.test.jsx`, `src/components/__tests__/TagFilter.test.jsx`

- [ ] **Step 1: Create Nav**

Create `src/components/Nav.jsx`:
```jsx
import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-12 py-5 flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold tracking-wide">Jimmy Hong</Link>
        <ul className="flex gap-8 list-none">
          <li><Link to="/projects" className="text-sm text-gray-500 hover:text-gray-900">作品集</Link></li>
          <li><Link to="/blog" className="text-sm text-gray-500 hover:text-gray-900">部落格</Link></li>
          <li><Link to="/about" className="text-sm text-gray-500 hover:text-gray-900">關於我</Link></li>
        </ul>
        <a href="mailto:your@email.com" className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          聯絡我
        </a>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create Footer**

Create `src/components/Footer.jsx`:
```jsx
export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-7 px-12">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <span className="text-xs text-gray-400">© {new Date().getFullYear()} Jimmy Hong</span>
        <span className="text-xs text-gray-400">Built with Vite + React · Hosted on Cloudflare Pages</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Create SEOHead**

Create `src/components/SEOHead.jsx`:
```jsx
import { Helmet } from 'react-helmet-async'

export default function SEOHead({ title, description, ogImage }) {
  const siteTitle = title ? `${title} | Jimmy Hong` : 'Jimmy Hong — QA Engineer'
  const metaDesc = description ?? '專注測試流程設計與品質架構的 QA Engineer。'

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={metaDesc} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content="website" />
    </Helmet>
  )
}
```

- [ ] **Step 4: Create MarkdownContent**

Create `src/components/MarkdownContent.jsx`:
```jsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownContent({ content }) {
  return (
    <div className="prose prose-gray max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content ?? ''}
      </ReactMarkdown>
    </div>
  )
}
```

Install Tailwind Typography plugin:
```bash
npm install -D @tailwindcss/typography
```

Update `tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
}
```

- [ ] **Step 5: Create ProjectCard**

Create `src/components/ProjectCard.jsx`:
```jsx
import { Link } from 'react-router-dom'

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="block border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {project.cover_url ? (
        <img src={project.cover_url} alt={project.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-300 text-4xl">🗂</div>
      )}
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-1">{project.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{project.description}</p>
        <div className="flex gap-1 flex-wrap">
          {(project.tags ?? []).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 6: Create BlogRow**

Create `src/components/BlogRow.jsx`:
```jsx
import { Link } from 'react-router-dom'

export default function BlogRow({ post }) {
  const date = post.published_at
    ? new Date(post.published_at).toISOString().slice(0, 10)
    : ''

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="flex items-baseline justify-between py-4 border-b border-gray-100 hover:text-gray-900 group"
    >
      <div className="flex gap-4 items-baseline">
        <span className="text-xs text-gray-400 min-w-[80px]">{date}</span>
        <span className="text-sm text-gray-600 group-hover:text-gray-900">{post.title}</span>
      </div>
      <div className="flex gap-1">
        {(post.tags ?? []).map(tag => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{tag}</span>
        ))}
      </div>
    </Link>
  )
}
```

- [ ] **Step 7: Write failing test for TagFilter**

Create `src/components/__tests__/TagFilter.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TagFilter from '../TagFilter'

describe('TagFilter', () => {
  const tags = ['測試策略', 'CI/CD', '自動化']

  it('renders all tags plus "全部" option', () => {
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} />)
    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText('測試策略')).toBeInTheDocument()
    expect(screen.getByText('CI/CD')).toBeInTheDocument()
  })

  it('calls onSelect with null when "全部" clicked', () => {
    const onSelect = vi.fn()
    render(<TagFilter tags={tags} selected="CI/CD" onSelect={onSelect} />)
    fireEvent.click(screen.getByText('全部'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('calls onSelect with tag name when tag clicked', () => {
    const onSelect = vi.fn()
    render(<TagFilter tags={tags} selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('CI/CD'))
    expect(onSelect).toHaveBeenCalledWith('CI/CD')
  })
})
```

- [ ] **Step 8: Run TagFilter test to confirm it fails**

```bash
npm run test:run -- src/components/__tests__/TagFilter.test.jsx
```
Expected: FAIL

- [ ] **Step 9: Implement TagFilter**

Create `src/components/TagFilter.jsx`:
```jsx
export default function TagFilter({ tags, selected, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap mb-8">
      <button
        onClick={() => onSelect(null)}
        className={`text-xs px-4 py-1.5 rounded-md border transition-colors ${
          selected === null
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
        }`}
      >
        全部
      </button>
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={`text-xs px-4 py-1.5 rounded-md border transition-colors ${
            selected === tag
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 10: Run TagFilter test to confirm it passes**

```bash
npm run test:run -- src/components/__tests__/TagFilter.test.jsx
```
Expected: PASS

- [ ] **Step 11: Write failing test for ProtectedRoute**

Create `src/components/__tests__/ProtectedRoute.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../hooks/useAuth'
import ProtectedRoute from '../ProtectedRoute'

describe('ProtectedRoute', () => {
  it('renders children when session exists', () => {
    useAuth.mockReturnValue({ session: { user: { id: '1' } }, loading: false })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute><div>Admin Content</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('redirects to /login when no session', () => {
    useAuth.mockReturnValue({ session: null, loading: false })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute><div>Admin Content</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 12: Run ProtectedRoute test to confirm it fails**

```bash
npm run test:run -- src/components/__tests__/ProtectedRoute.test.jsx
```
Expected: FAIL

- [ ] **Step 13: Implement ProtectedRoute**

Create `src/components/ProtectedRoute.jsx`:
```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return children
}
```

- [ ] **Step 14: Run ProtectedRoute test to confirm it passes**

```bash
npm run test:run -- src/components/__tests__/ProtectedRoute.test.jsx
```
Expected: PASS

- [ ] **Step 15: Commit**

```bash
git add src/components/
git commit -m "feat: add Nav, Footer, SEOHead, MarkdownContent, ProjectCard, BlogRow, TagFilter, ProtectedRoute with tests"
```

---

## Task 5: Home Page

**Files:**
- Create: `src/pages/Home.jsx`

- [ ] **Step 1: Build Home page**

Create `src/pages/Home.jsx`:
```jsx
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import ProjectCard from '../components/ProjectCard'
import BlogRow from '../components/BlogRow'
import { usePosts } from '../hooks/usePosts'
import { useProjects } from '../hooks/useProjects'

const SERVICES = [
  { icon: '🗂', title: 'QA 流程審查', desc: '針對現有測試流程進行健診，找出瓶頸與缺口，提供具體改善建議。' },
  { icon: '🤖', title: '自動化導入顧問', desc: '協助團隊評估與導入自動化測試框架，從工具選型到 CI 整合一條龍。' },
  { icon: '📐', title: '測試策略規劃', desc: '依產品特性設計測試金字塔與覆蓋率目標，讓品質投入有效率。' },
]

export default function Home() {
  const { posts } = usePosts()
  const { projects } = useProjects()

  return (
    <>
      <SEOHead />
      <Nav />
      <main>
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-12 py-20 grid grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex gap-7 items-start">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden ring-2 ring-gray-100 ring-offset-2">
                <img src="/avatar.jpg" alt="Jimmy Hong" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
              </div>
              <div>
                <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">QA Engineer / 品質架構師</p>
                <h1 className="text-3xl font-bold mb-1">Jimmy Hong</h1>
                <p className="text-sm text-gray-500 mb-4">打造讓團隊信任的 QA 系統</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  專注測試流程設計與品質架構。<br />
                  從流程標準化到自動化導入，<br />
                  讓品質成為開發文化，而不是最後一道關卡。
                </p>
                <div className="flex gap-2 flex-wrap mb-6">
                  {['測試策略', 'CI/CD 整合', '自動化框架', 'QA 流程設計'].map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <a href="/projects" className="text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700">看作品集</a>
                  <a href="/blog" className="text-xs text-gray-500 border-b border-gray-300 pb-px hover:text-gray-900">閱讀文章</a>
                  <div className="flex gap-2 ml-1">
                    <a href="https://github.com/" target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">gh</a>
                    <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">in</a>
                    <a href="mailto:your@email.com" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">✉</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Services card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7">
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Services</p>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {SERVICES.map(s => (
                <div key={s.title} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="text-xs text-gray-600">{s.title}</div>
                </div>
              ))}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-lg mb-1">📊</div>
                <div className="text-xs text-gray-600">品質指標設計</div>
              </div>
            </div>
            <div className="flex gap-2">
              {[['3+', '年 QA 經驗'], ['10+', '專案'], ['5+', '文章']].map(([n, l]) => (
                <div key={l} className="flex-1 bg-gray-100 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold">{n}</div>
                  <div className="text-xs text-gray-400">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-gray-100 mx-12" />

        {/* Featured projects */}
        <section className="max-w-5xl mx-auto px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">精選作品</p>
          <h2 className="text-xl font-bold mb-8">QA 作品集</h2>
          <div className="grid grid-cols-3 gap-5">
            {projects.slice(0, 3).map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>

        <hr className="border-gray-100 mx-12" />

        {/* Recent posts */}
        <section className="max-w-5xl mx-auto px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">近期文章</p>
          <h2 className="text-xl font-bold mb-2">部落格</h2>
          <div>
            {posts.slice(0, 3).map(p => <BlogRow key={p.id} post={p} />)}
          </div>
        </section>

        <hr className="border-gray-100 mx-12" />

        {/* Services */}
        <section className="max-w-5xl mx-auto px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">合作方式</p>
          <h2 className="text-xl font-bold mb-8">Services</h2>
          <div className="grid grid-cols-3 gap-4">
            {SERVICES.map(s => (
              <div key={s.title} className="border border-gray-200 rounded-xl p-6">
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Wire Home into App.jsx**

Update `src/App.jsx`, replace `<div>Home</div>` with:
```jsx
import Home from './pages/Home'
// ... in Routes:
<Route path="/" element={<Home />} />
```

- [ ] **Step 3: Add placeholder avatar**

```bash
# Add your actual photo as public/avatar.jpg
# For now, create a placeholder:
echo "" > public/avatar.jpg
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```
Open `http://localhost:5173`. Verify Hero renders, Services card shows, sections display. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.jsx src/App.jsx public/avatar.jpg
git commit -m "feat: add Home page with Hero, projects, blog, services"
```

---

## Task 6: Projects Pages

**Files:**
- Create: `src/pages/Projects.jsx`, `src/pages/ProjectDetail.jsx`

- [ ] **Step 1: Build Projects list page**

Create `src/pages/Projects.jsx`:
```jsx
import { useState, useMemo } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import ProjectCard from '../components/ProjectCard'
import TagFilter from '../components/TagFilter'
import { useProjects } from '../hooks/useProjects'

export default function Projects() {
  const [selectedTag, setSelectedTag] = useState(null)
  const { projects, loading } = useProjects()

  const allTags = useMemo(() => {
    const set = new Set(projects.flatMap(p => p.tags ?? []))
    return [...set]
  }, [projects])

  const filtered = selectedTag
    ? projects.filter(p => p.tags?.includes(selectedTag))
    : projects

  return (
    <>
      <SEOHead title="QA 作品集" description="Jimmy Hong 的 QA 專案作品集，涵蓋自動化測試、流程設計、品質儀表板。" />
      <Nav />
      <main className="max-w-5xl mx-auto px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Portfolio</p>
        <h1 className="text-xl font-bold mb-8">QA 作品集</h1>
        <TagFilter tags={allTags} selected={selectedTag} onSelect={setSelectedTag} />
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Build ProjectDetail page**

Create `src/pages/ProjectDetail.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import MarkdownContent from '../components/MarkdownContent'
import { supabase } from '../lib/supabase'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProject(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <><Nav /><div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">載入中…</div><Footer /></>
  if (!project) return <><Nav /><div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">找不到此作品。</div><Footer /></>

  return (
    <>
      <SEOHead title={project.title} description={project.description} />
      <Nav />
      <main className="max-w-3xl mx-auto px-12 py-16">
        {project.cover_url && (
          <img src={project.cover_url} alt={project.title} className="w-full rounded-xl mb-8 border border-gray-100" />
        )}
        <div className="flex gap-2 flex-wrap mb-3">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-4">{project.title}</h1>
        {project.links && Object.entries(project.links).length > 0 && (
          <div className="flex gap-3 mb-8">
            {project.links.github && <a href={project.links.github} target="_blank" rel="noreferrer" className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">GitHub →</a>}
            {project.links.demo && <a href={project.links.demo} target="_blank" rel="noreferrer" className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">Demo →</a>}
          </div>
        )}
        <MarkdownContent content={project.content} />
        <div className="mt-12">
          <Link to="/projects" className="text-xs text-gray-400 hover:text-gray-700">← 回作品集</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Wire into App.jsx**

Update `src/App.jsx`:
```jsx
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
// in Routes:
<Route path="/projects" element={<Projects />} />
<Route path="/projects/:id" element={<ProjectDetail />} />
```

- [ ] **Step 4: Verify in browser**

Add one project row directly in Supabase Dashboard → Table Editor → `projects`. Navigate to `/projects`. Click a card, verify detail page renders Markdown.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Projects.jsx src/pages/ProjectDetail.jsx src/App.jsx
git commit -m "feat: add Projects list and detail pages"
```

---

## Task 7: Blog Pages

**Files:**
- Create: `src/pages/Blog.jsx`, `src/pages/BlogPost.jsx`

- [ ] **Step 1: Build Blog list page**

Create `src/pages/Blog.jsx`:
```jsx
import { useState, useMemo } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import BlogRow from '../components/BlogRow'
import TagFilter from '../components/TagFilter'
import { usePosts } from '../hooks/usePosts'

export default function Blog() {
  const [selectedTag, setSelectedTag] = useState(null)
  const { posts, loading } = usePosts()

  const allTags = useMemo(() => {
    const set = new Set(posts.flatMap(p => p.tags ?? []))
    return [...set]
  }, [posts])

  const filtered = selectedTag
    ? posts.filter(p => p.tags?.includes(selectedTag))
    : posts

  return (
    <>
      <SEOHead title="部落格" description="Jimmy Hong 關於 QA 流程、測試策略、自動化的技術文章。" />
      <Nav />
      <main className="max-w-5xl mx-auto px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Blog</p>
        <h1 className="text-xl font-bold mb-8">文章</h1>
        <TagFilter tags={allTags} selected={selectedTag} onSelect={setSelectedTag} />
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : (
          <div>{filtered.map(p => <BlogRow key={p.id} post={p} />)}</div>
        )}
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Build BlogPost page**

Create `src/pages/BlogPost.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import MarkdownContent from '../components/MarkdownContent'
import { supabase } from '../lib/supabase'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
      .then(({ data }) => {
        setPost(data)
        setLoading(false)
      })
  }, [slug])

  if (loading) return <><Nav /><div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">載入中…</div><Footer /></>
  if (!post) return <><Nav /><div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">找不到此文章。</div><Footer /></>

  const postUrl = `${window.location.origin}/blog/${slug}`
  const shareText = encodeURIComponent(post.title)
  const shareUrl = encodeURIComponent(postUrl)
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
  const xShare = `https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`

  return (
    <>
      <Helmet>
        <title>{post.title} | Jimmy Hong</title>
        <meta name="description" content={post.excerpt ?? ''} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt ?? ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
      </Helmet>
      <Nav />
      <main className="max-w-3xl mx-auto px-12 py-16">
        <div className="flex gap-2 flex-wrap mb-3">
          {(post.tags ?? []).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
        <p className="text-xs text-gray-400 mb-10">
          {post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : ''}
        </p>
        <MarkdownContent content={post.content} />
        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-4">
          <span className="text-xs text-gray-400">分享：</span>
          <a href={linkedInShare} target="_blank" rel="noreferrer" className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">LinkedIn</a>
          <a href={xShare} target="_blank" rel="noreferrer" className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">X (Twitter)</a>
        </div>
        <div className="mt-8">
          <Link to="/blog" className="text-xs text-gray-400 hover:text-gray-700">← 回文章列表</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Wire into App.jsx**

Update `src/App.jsx`:
```jsx
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
// in Routes:
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Blog.jsx src/pages/BlogPost.jsx src/App.jsx
git commit -m "feat: add Blog list and post pages with share buttons + OG meta"
```

---

## Task 8: About Page

**Files:**
- Create: `src/pages/About.jsx`

- [ ] **Step 1: Build About page**

Create `src/pages/About.jsx`:
```jsx
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'

const SKILLS = [
  'Appium', 'Playwright', 'pytest', 'Python',
  'CI/CD', 'GitHub Actions', 'Supabase', 'Linear',
  '測試策略', '流程設計', 'QA 系統設計',
]

const EXPERIENCE = [
  {
    company: 'Seekrtech',
    role: 'QA Engineer',
    period: '2023 — 現在',
    desc: '建立 Mobile App 自動化測試框架（iOS/Android）、QA 流程規範、品質儀表板。導入 Appium + CI/CD 讓 regression 週期縮短 60%。',
  },
]

const SERVICES = [
  { icon: '🗂', title: 'QA 流程審查', desc: '針對現有測試流程進行健診，找出瓶頸與缺口，提供具體改善建議。' },
  { icon: '🤖', title: '自動化導入顧問', desc: '協助團隊評估與導入自動化測試框架，從工具選型到 CI 整合一條龍。' },
  { icon: '📐', title: '測試策略規劃', desc: '依產品特性設計測試金字塔與覆蓋率目標，讓品質投入有效率。' },
]

export default function About() {
  return (
    <>
      <SEOHead title="關於我" description="Jimmy Hong — QA Engineer，專注測試流程設計與品質架構。" />
      <Nav />
      <main className="max-w-2xl mx-auto px-12 py-16">
        <div className="flex gap-6 items-start mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden ring-2 ring-gray-100 ring-offset-2">
            <img src="/avatar.jpg" alt="Jimmy Hong" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
          </div>
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">About</p>
            <h1 className="text-2xl font-bold mb-1">Hi，我是 Jimmy Hong</h1>
            <p className="text-sm text-gray-500">QA Engineer / 品質架構師</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-10">
          我相信「品質是設計出來的，不是測出來的」。<br /><br />
          從手動測試起步，逐步建立自動化框架與測試流程，目前專注於幫助團隊設計可擴展的 QA 系統——讓品質內化成開發文化，而不是 release 前的最後一關。<br /><br />
          平時喜歡把工作上遇到的流程問題和解法整理成文章，分享給同樣在 QA 路上的夥伴。
        </p>
        <hr className="border-gray-100 mb-10" />
        <h2 className="text-sm font-semibold mb-4">技能</h2>
        <div className="flex gap-2 flex-wrap mb-10">
          {SKILLS.map(s => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{s}</span>)}
        </div>
        <hr className="border-gray-100 mb-10" />
        <h2 className="text-sm font-semibold mb-6">工作經歷</h2>
        {EXPERIENCE.map(e => (
          <div key={e.company} className="mb-6">
            <div className="text-sm font-semibold">{e.role} · {e.company}</div>
            <div className="text-xs text-gray-400 mt-1 mb-2">{e.period}</div>
            <p className="text-sm text-gray-500 leading-relaxed">{e.desc}</p>
          </div>
        ))}
        <hr className="border-gray-100 mb-10" />
        <h2 className="text-sm font-semibold mb-4">合作方式</h2>
        <div className="grid grid-cols-1 gap-4 mb-10">
          {SERVICES.map(s => (
            <div key={s.title} className="border border-gray-200 rounded-xl p-5 flex gap-4">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <h3 className="text-sm font-semibold mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <a href="mailto:your@email.com" className="inline-block text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700">聯絡我</a>
        <div className="flex gap-2 mt-4">
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">gh</a>
          <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">in</a>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Wire into App.jsx**

```jsx
import About from './pages/About'
// in Routes:
<Route path="/about" element={<About />} />
```

- [ ] **Step 3: Update placeholder values in About.jsx and Home.jsx**

In both files, replace:
- `href="mailto:your@email.com"` → your actual personal email
- `href="https://github.com/"` → your GitHub URL
- `href="https://linkedin.com/"` → your LinkedIn URL

- [ ] **Step 4: Commit**

```bash
git add src/pages/About.jsx src/App.jsx
git commit -m "feat: add About page with bio, skills, experience, services"
```

---

## Task 9: Login Page + Auth Flow

**Files:**
- Create: `src/pages/Login.jsx`

- [ ] **Step 1: Build Login page**

Create `src/pages/Login.jsx`:
```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEOHead from '../components/SEOHead'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <>
      <SEOHead title="登入" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="text-lg font-bold mb-2">管理員登入</h1>
          <p className="text-xs text-gray-400 mb-6">輸入 email，系統會寄送 magic link。</p>
          {sent ? (
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
              Magic link 已寄出！請檢查 <strong>{email}</strong> 的信箱。
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:border-gray-400"
              />
              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-sm bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? '傳送中…' : '傳送 Magic Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Wire into App.jsx and add ProtectedRoute to admin**

Update `src/App.jsx`:
```jsx
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
// Routes:
<Route path="/login" element={<Login />} />
<Route path="/admin/*" element={
  <ProtectedRoute>
    <div>Admin Placeholder</div>
  </ProtectedRoute>
} />
```

- [ ] **Step 3: Verify login flow**

```bash
npm run dev
```
Navigate to `/admin` → should redirect to `/login`. Enter your email, check inbox for magic link. Click link → should redirect to `/admin`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.jsx src/App.jsx
git commit -m "feat: add Login page with Supabase Magic Link auth"
```

---

## Task 10: Admin — Posts Management

**Files:**
- Create: `src/pages/admin/AdminLayout.jsx`, `src/pages/admin/AdminPosts.jsx`, `src/pages/admin/AdminPostEdit.jsx`

- [ ] **Step 1: Build AdminLayout**

Create `src/pages/admin/AdminLayout.jsx`:
```jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-52 border-r border-gray-200 bg-gray-50 p-5 flex flex-col">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Admin</p>
        <nav className="flex flex-col gap-1 flex-1">
          <NavLink
            to="/admin/posts"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            📝 文章管理
          </NavLink>
          <NavLink
            to="/admin/projects"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            🗂 作品集管理
          </NavLink>
        </nav>
        <button onClick={handleSignOut} className="text-sm text-red-400 px-3 py-2 rounded-md hover:bg-red-50 text-left">
          🔓 登出
        </button>
      </aside>
      <main className="flex-1 p-10 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Build AdminPosts**

Create `src/pages/admin/AdminPosts.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminPosts() {
  const [posts, setPosts] = useState([])

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('id, title, tags, published, published_at')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
  }

  useEffect(() => { fetchPosts() }, [])

  async function handleDelete(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('posts').delete().eq('id', id)
    fetchPosts()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-lg font-bold">文章管理</h1>
        <Link to="/admin/posts/new" className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          + 新增文章
        </Link>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標題</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標籤</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">狀態</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">日期</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-sm">{post.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {(post.tags ?? []).map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {post.published
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">已發布</span>
                    : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">草稿</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/admin/posts/${post.id}`} className="text-xs border border-gray-200 px-3 py-1 rounded hover:border-gray-400">編輯</Link>
                    <button onClick={() => handleDelete(post.id)} className="text-xs border border-red-100 text-red-500 px-3 py-1 rounded hover:border-red-300">刪除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build AdminPostEdit**

Create `src/pages/admin/AdminPostEdit.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function AdminPostEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', slug: '', content: '', excerpt: '',
    tags: '', published: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) {
      supabase.from('posts').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({ ...data, tags: (data.tags ?? []).join(', ') })
      })
    }
  }, [id, isNew])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => {
      const updated = { ...f, [name]: type === 'checkbox' ? checked : value }
      if (name === 'title' && isNew) updated.slug = slugify(value)
      return updated
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      published_at: form.published ? (form.published_at || new Date().toISOString()) : null,
    }
    if (isNew) {
      await supabase.from('posts').insert(payload)
    } else {
      await supabase.from('posts').update(payload).eq('id', id)
    }
    navigate('/admin/posts')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold mb-7">{isNew ? '新增文章' : '編輯文章'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標題</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Slug（URL）</label>
          <input name="slug" value={form.slug} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">摘要</label>
          <input name="excerpt" value={form.excerpt} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標籤（逗號分隔，如：測試策略, CI/CD）</label>
          <input name="tags" value={form.tags} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容（Markdown）</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={16}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 font-mono" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="published" checked={form.published} onChange={handleChange} />
          發布
        </label>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
          <button type="button" onClick={() => navigate('/admin/posts')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Wire admin routes into App.jsx**

Update `src/App.jsx`:
```jsx
import AdminLayout from './pages/admin/AdminLayout'
import AdminPosts from './pages/admin/AdminPosts'
import AdminPostEdit from './pages/admin/AdminPostEdit'
import { Navigate } from 'react-router-dom'

// Replace admin route:
<Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
  <Route index element={<Navigate to="/admin/posts" replace />} />
  <Route path="posts" element={<AdminPosts />} />
  <Route path="posts/:id" element={<AdminPostEdit />} />
</Route>
```

- [ ] **Step 5: Verify admin posts flow**

Log in via `/login`. Navigate to `/admin/posts`. Click `+ 新增文章`. Fill form, publish. Verify post appears in `/blog`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/
git commit -m "feat: add Admin posts management (list, create, edit, delete)"
```

---

## Task 11: Admin — Projects Management

**Files:**
- Create: `src/pages/admin/AdminProjects.jsx`, `src/pages/admin/AdminProjectEdit.jsx`

- [ ] **Step 1: Build AdminProjects**

Create `src/pages/admin/AdminProjects.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminProjects() {
  const [projects, setProjects] = useState([])

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('id, title, tags, display_order')
      .order('display_order', { ascending: true })
    setProjects(data ?? [])
  }

  useEffect(() => { fetchProjects() }, [])

  async function handleDelete(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('projects').delete().eq('id', id)
    fetchProjects()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-lg font-bold">作品集管理</h1>
        <Link to="/admin/projects/new" className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          + 新增作品
        </Link>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標題</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">標籤</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">排序</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-sm">{p.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {(p.tags ?? []).map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{p.display_order}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/admin/projects/${p.id}`} className="text-xs border border-gray-200 px-3 py-1 rounded hover:border-gray-400">編輯</Link>
                    <button onClick={() => handleDelete(p.id)} className="text-xs border border-red-100 text-red-500 px-3 py-1 rounded hover:border-red-300">刪除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build AdminProjectEdit**

Create `src/pages/admin/AdminProjectEdit.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminProjectEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', description: '', content: '',
    tags: '', cover_url: '',
    github: '', demo: '',
    display_order: 0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) {
      supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({
          ...data,
          tags: (data.tags ?? []).join(', '),
          github: data.links?.github ?? '',
          demo: data.links?.demo ?? '',
        })
      })
    }
  }, [id, isNew])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description,
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      cover_url: form.cover_url || null,
      links: { github: form.github || null, demo: form.demo || null },
      display_order: Number(form.display_order),
    }
    if (isNew) {
      await supabase.from('projects').insert(payload)
    } else {
      await supabase.from('projects').update(payload).eq('id', id)
    }
    navigate('/admin/projects')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold mb-7">{isNew ? '新增作品' : '編輯作品'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標題</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">描述（簡短說明）</label>
          <input name="description" value={form.description} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標籤（逗號分隔）</label>
          <input name="tags" value={form.tags} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">封面圖片 URL</label>
          <input name="cover_url" value={form.cover_url} onChange={handleChange}
            placeholder="https://..."
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">GitHub URL</label>
            <input name="github" value={form.github} onChange={handleChange}
              placeholder="https://github.com/..."
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Demo URL</label>
            <input name="demo" value={form.demo} onChange={handleChange}
              placeholder="https://..."
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容（Markdown）</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={14}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 font-mono" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">排序（數字越小越前面）</label>
          <input name="display_order" type="number" value={form.display_order} onChange={handleChange}
            className="w-32 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
          <button type="button" onClick={() => navigate('/admin/projects')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Add projects routes to App.jsx**

```jsx
import AdminProjects from './pages/admin/AdminProjects'
import AdminProjectEdit from './pages/admin/AdminProjectEdit'

// Inside the admin Route:
<Route path="projects" element={<AdminProjects />} />
<Route path="projects/:id" element={<AdminProjectEdit />} />
```

- [ ] **Step 4: Verify admin projects flow**

Navigate to `/admin/projects`. Create a project. Verify it appears on `/projects` page.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminProjects.jsx src/pages/admin/AdminProjectEdit.jsx src/App.jsx
git commit -m "feat: add Admin projects management (list, create, edit, delete)"
```

---

## Task 12: GitHub Repo + Cloudflare Pages Deploy

**Files:**
- Create: `.gitignore` additions, `public/robots.txt`

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create jimmy-hong-portfolio --public --source=. --push
```

Or manually via GitHub UI, then:
```bash
git remote add origin https://github.com/your-username/jimmy-hong-portfolio.git
git push -u origin main
```

- [ ] **Step 2: Add robots.txt**

Create `public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /login

Sitemap: https://your-domain.pages.dev/sitemap.xml
```

- [ ] **Step 3: Set up Cloudflare Pages**

1. Go to Cloudflare Dashboard → Pages → Create application → Connect to Git
2. Select your `jimmy-hong-portfolio` repo
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Environment variables → Add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Save and deploy

- [ ] **Step 4: Configure SPA routing on Cloudflare Pages**

Create `public/_redirects`:
```
/* /index.html 200
```

This ensures React Router handles all routes instead of Cloudflare returning 404.

- [ ] **Step 5: Verify production deploy**

After deploy completes (2-3 min), open the `*.pages.dev` URL. Verify:
- Home page loads
- `/projects` works
- `/blog` works
- `/login` redirects to `/admin` after magic link

- [ ] **Step 6: Update robots.txt with real domain**

Replace `your-domain.pages.dev` with the actual assigned URL.

- [ ] **Step 7: Commit**

```bash
git add public/robots.txt public/_redirects
git commit -m "feat: add Cloudflare Pages deploy config + robots.txt + SPA redirects"
git push
```

---

## Task 13: Final Touches

**Files:**
- Modify: `src/pages/Home.jsx`, `src/pages/About.jsx`, `src/components/Nav.jsx`

- [ ] **Step 1: Add real avatar photo**

Replace `public/avatar.jpg` with your actual photo (crop to square, min 200×200px).

- [ ] **Step 2: Update real links**

In `src/pages/Home.jsx`, `src/pages/About.jsx`, `src/components/Nav.jsx`:
- `mailto:your@email.com` → your personal email
- `https://github.com/` → `https://github.com/your-username`
- `https://linkedin.com/` → `https://www.linkedin.com/in/your-profile`

- [ ] **Step 3: Add first real content via Admin**

Log in to `/admin`. Create your first real:
- 1 project (any past QA project with Markdown description)
- 1 blog post (可以是這個網站的建站過程)

- [ ] **Step 4: Run all tests**

```bash
npm run test:run
```
Expected: All PASS

- [ ] **Step 5: Final commit + push**

```bash
git add .
git commit -m "feat: final touches — real avatar, links, first content"
git push
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Vite + React 18 + React Router v6 | Task 1 |
| Tailwind CSS极简白 | Task 1, 4, 5 |
| Supabase schema + RLS | Task 2 |
| Magic Link auth + ProtectedRoute | Task 9, 4 |
| usePosts + useProjects hooks | Task 3 |
| Nav + Footer | Task 4 |
| SEOHead + OG meta | Task 4, 7 |
| Home page (Hero + projects + blog + services) | Task 5 |
| /projects + tag filter | Task 6 |
| /projects/:id + Markdown | Task 6 |
| /blog + tag filter | Task 7 |
| /blog/:slug + share buttons + OG | Task 7 |
| /about (hardcoded) | Task 8 |
| /login Magic Link form | Task 9 |
| /admin layout + sidebar | Task 10 |
| /admin/posts CRUD | Task 10 |
| /admin/projects CRUD | Task 11 |
| Cloudflare Pages deploy | Task 12 |
| robots.txt | Task 12 |
| Avatar photo | Task 13 |
| Real social links | Task 13 |
