# 後台課程管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 後台新增「課程管理」區:`courses` 表 + `posts` 加 course 關聯,seed 把 `docs/course-*/` 6 門課灌進 DB(章節為 draft posts),後台可上課程/各章封面、排序;不加任何公開頁。

**Architecture:** `courses` 獨立表存課程層(封面/published/順序);章節內文進 `posts`,以 `course_id`/`course_order`/`cover_url` 關聯。後台兩頁(list/edit)鏡像現有 `AdminPhotoProjects`/`AdminPhotoProjectEdit`,封面上傳複用 `useUpload`,章節內文編輯複用 `AdminPostEdit`。seed 冪等非破壞(已存在不覆寫)。

**Tech Stack:** React + react-router + Supabase JS + Tailwind;vitest + @testing-library/react;Node ESM seed 腳本。

> **Spec:** `docs/superpowers/specs/2026-06-21-admin-course-management-design.md`(實作前先讀)

---

## 慣例(每個 component/script 都套)
- supabase client:`import { supabase } from '<相對路徑>/lib/supabase'`(admin 頁在 `src/pages/admin/` → `../../lib/supabase`)。
- 上傳:`const { uploading, uploadError, uploadOne } = useUpload()`;`uploadOne(file, url => setX(url))`。
- 測試:`vitest`,mock `../../../lib/supabase`(見 `src/pages/admin/__tests__/AdminPosts.test.jsx` 範式)。
- 跑測試:`npm run test:run -- <path>`。

---

## Task 1:Schema — `courses` 表 + `posts` 加三欄

DB migration 由人在 Supabase SQL Editor 執行(無自動 migration 工具)。SQL 冪等可重跑。

**Files:**
- Modify: `supabase/schema.sql`(把下列 SQL 加在 photo_projects 區塊後、policies 區塊;courses policies 放 RLS 段)

- [ ] **Step 1:在 `supabase/schema.sql` 加 `courses` 表(放在 `photo_projects` trigger 之後)**

```sql
-- Courses (課程實體；章節內文存在 posts，以 course_id 關聯)
CREATE TABLE IF NOT EXISTS courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  subtitle      text,
  description   text,
  cover_url     text,
  tags          text[] DEFAULT '{}',
  published     boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS courses_set_updated_at ON courses;
CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

- [ ] **Step 2:在 `posts` 區塊後加三欄 + 索引**

```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS course_id    uuid REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS course_order int;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_url    text;
CREATE INDEX IF NOT EXISTS posts_course_idx ON posts (course_id, course_order);
```

- [ ] **Step 3:加 RLS(放 RLS policies 段,courses 緊跟 photo_projects policies)**

```sql
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read published courses" ON courses;
CREATE POLICY "anon read published courses"
  ON courses FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS "auth full access courses" ON courses;
CREATE POLICY "auth full access courses"
  ON courses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

- [ ] **Step 4:人工套用** — 把上述三段貼進 Supabase SQL Editor 執行(memory:用 `$$` 不用 `$BODY$`,此處無函式不影響)。驗證:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='posts' AND column_name IN ('course_id','course_order','cover_url');
-- 預期回三列
SELECT count(*) FROM courses; -- 預期 0
```

- [ ] **Step 5:Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(db): courses 表 + posts 加 course_id/course_order/cover_url"
```

---

## Task 2:Seed 純函式 + 單測(TDD)

把檔名解析、slug 產生抽成可測純函式,seed 腳本與測試共用。

**Files:**
- Create: `scripts/lib/courseSeed.js`
- Test: `scripts/lib/__tests__/courseSeed.test.js`

- [ ] **Step 1:寫失敗測試**

```js
// scripts/lib/__tests__/courseSeed.test.js
import { describe, it, expect } from 'vitest'
import { parseChapterFile, chapterSlug, courseShort } from '../courseSeed.js'

describe('parseChapterFile', () => {
  it('抽出 key 與 order', () => {
    expect(parseChapterFile('article-S01-why-qa-second-brain.md')).toEqual({ key: 'S01', order: 1 })
    expect(parseChapterFile('article-A12-foo.md')).toEqual({ key: 'A12', order: 12 })
    expect(parseChapterFile('article-L20-bar-baz.md')).toEqual({ key: 'L20', order: 20 })
  })
  it('非章節檔回 null', () => {
    expect(parseChapterFile('README.md')).toBeNull()
    expect(parseChapterFile('_preview.html')).toBeNull()
  })
})

describe('courseShort', () => {
  it('去掉 course- 前綴', () => {
    expect(courseShort('course-second-brain')).toBe('second-brain')
    expect(courseShort('course-perf')).toBe('perf')
  })
})

describe('chapterSlug', () => {
  it('課短名 + 檔名base，小寫', () => {
    expect(chapterSlug('course-second-brain', 'article-S01-why-qa-second-brain.md'))
      .toBe('second-brain-s01-why-qa-second-brain')
  })
})
```

- [ ] **Step 2:跑測試確認失敗**

Run: `npm run test:run -- scripts/lib/__tests__/courseSeed.test.js`
Expected: FAIL(模組不存在)

- [ ] **Step 3:實作 `scripts/lib/courseSeed.js`**

```js
// 課程 seed 用純函式（無 IO，可單測）

// 'article-S01-foo.md' -> { key: 'S01', order: 1 }；非章節檔回 null
export function parseChapterFile(filename) {
  const m = filename.match(/^article-([A-Za-z]+\d+)-.*\.md$/)
  if (!m) return null
  const key = m[1].toUpperCase()
  const order = parseInt(key.replace(/\D/g, ''), 10)
  return { key, order }
}

// 'course-second-brain' -> 'second-brain'
export function courseShort(courseSlug) {
  return courseSlug.replace(/^course-/, '')
}

// 章節 slug：課短名 + 檔名base（去 article- 與 .md），全小寫
export function chapterSlug(courseSlug, filename) {
  const base = filename.replace(/^article-/, '').replace(/\.md$/, '')
  return `${courseShort(courseSlug)}-${base}`.toLowerCase()
}
```

- [ ] **Step 4:跑測試確認通過**

Run: `npm run test:run -- scripts/lib/__tests__/courseSeed.test.js`
Expected: PASS

- [ ] **Step 5:Commit**

```bash
git add scripts/lib/courseSeed.js scripts/lib/__tests__/courseSeed.test.js
git commit -m "feat(seed): 課程章節檔名解析與 slug 純函式 + 測試"
```

---

## Task 3:Seed 腳本(掃 docs、冪等非破壞)

**Files:**
- Create: `scripts/seed-courses.mjs`

依賴:env `VITE_SERVICE_ROLE_KEY`(寫入用,memory 既有 node script 套路)+ 專案 supabase URL。

- [ ] **Step 1:寫腳本**

```js
// scripts/seed-courses.mjs
// 掃 docs/course-*/，把課灌進 courses、章節內文灌進 posts（draft）。
// 冪等非破壞：已存在的 course/post（以 slug 判）不覆寫使用者編輯。
// 用法：node scripts/seed-courses.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseChapterFile, chapterSlug } from './lib/courseSeed.js'

const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const KEY = process.env.VITE_SERVICE_ROLE_KEY
if (!KEY) { console.error('缺 VITE_SERVICE_ROLE_KEY（請從 .env.local 帶入）'); process.exit(1) }
const DRY = process.argv.includes('--dry-run')
const supabase = createClient(SUPABASE_URL, KEY)

// 課程顯示順序（穩定預設）
const ORDER = { 'course-perf': 1, 'course-k6': 2, 'course-api': 3, 'course-quality': 4, 'course-comm': 5, 'course-second-brain': 6 }

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) return { body: content, fm: {} }
  const fm = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':'); if (i < 0) continue
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { body: content.slice(m[0].length), fm }
}
function parseTags(raw) {
  const m = (raw || '').match(/\[([^\]]*)\]/)
  return m ? m[1].split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : []
}
function firstHeading(md) { const m = md.match(/^#\s+(.+)/m); return m ? m[1].trim() : '' }
function readmeMeta(dir) {
  let md = ''
  try { md = readFileSync(join(dir, 'README.md'), 'utf8') } catch { return { title: '', subtitle: '', description: '' } }
  const title = firstHeading(md)
  const bq = md.match(/^>\s*定位[:：]\s*(.+)$/m)
  return { title, subtitle: bq ? bq[1].trim() : '', description: '' }
}

const docsDir = 'docs'
const courseDirs = readdirSync(docsDir).filter(d => d.startsWith('course-'))

for (const cdir of courseDirs) {
  const full = join(docsDir, cdir)
  const meta = readmeMeta(full)
  // upsert course（保留既有 cover_url/published/display_order）
  const { data: existing } = await supabase.from('courses').select('id, cover_url, published, display_order').eq('slug', cdir).maybeSingle()
  let courseId = existing?.id
  const coursePayload = {
    slug: cdir, title: meta.title || cdir, subtitle: meta.subtitle, description: meta.description,
    cover_url: existing?.cover_url ?? null,
    published: existing?.published ?? false,
    display_order: existing?.display_order ?? ORDER[cdir] ?? 99,
  }
  console.log(`課程 ${cdir} -> ${coursePayload.title}${existing ? ' (更新標題，保留封面/published)' : ' (新建)'}`)
  if (!DRY) {
    if (existing) await supabase.from('courses').update(coursePayload).eq('id', courseId)
    else { const { data } = await supabase.from('courses').insert(coursePayload).select('id').single(); courseId = data.id }
  }

  // 章節
  const files = readdirSync(full).filter(f => parseChapterFile(f)).sort()
  for (const f of files) {
    const { order } = parseChapterFile(f)
    const slug = chapterSlug(cdir, f)
    const { body, fm } = parseFrontmatter(readFileSync(join(full, f), 'utf8'))
    const { data: post } = await supabase.from('posts').select('id').eq('slug', slug).maybeSingle()
    if (post) { console.log(`  章節 ${slug} 已存在 → 跳過`); continue }   // 非破壞
    const payload = {
      title: fm.title || firstHeading(body) || slug,
      slug, content: body, excerpt: fm.excerpt || '',
      tags: parseTags(fm.tags), published: false,
      course_id: courseId ?? null, course_order: order, cover_url: null,
    }
    console.log(`  章節 ${slug} (order ${order}) → ${DRY ? 'DRY' : 'insert'}`)
    if (!DRY && courseId) await supabase.from('posts').insert(payload)
  }
}
console.log('完成。')
```

- [ ] **Step 2:dry-run 驗證(不寫 DB)**

Run: `VITE_SERVICE_ROLE_KEY=$(grep VITE_SERVICE_ROLE_KEY .env.local | cut -d= -f2) node scripts/seed-courses.mjs --dry-run`
Expected:列出 6 門課與各章 `(order N) DRY`,無錯誤。檢查課名/章序合理。

- [ ] **Step 3:Commit(先不真跑,留到 Task 7)**

```bash
git add scripts/seed-courses.mjs
git commit -m "feat(seed): seed-courses 掃 docs 灌 courses/posts（冪等非破壞）"
```

---

## Task 4:`AdminCourses` 列表頁 + 測試

**Files:**
- Create: `src/pages/admin/AdminCourses.jsx`
- Test: `src/pages/admin/__tests__/AdminCourses.test.jsx`

- [ ] **Step 1:寫失敗測試**

```jsx
// src/pages/admin/__tests__/AdminCourses.test.jsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminCourses from '../AdminCourses'

vi.mock('../../../lib/supabase', () => {
  const COURSES = [
    { id: '1', title: 'QA 的第二大腦', slug: 'course-second-brain', published: false, display_order: 6, chapter_count: 9 },
    { id: '2', title: '效能測試課', slug: 'course-perf', published: false, display_order: 1, chapter_count: 20 },
  ]
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: COURSES }),
      })),
    }
  }
})

it('顯示課名與章節數', async () => {
  render(<MemoryRouter><AdminCourses /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText('QA 的第二大腦')).toBeInTheDocument())
  expect(screen.getByText('效能測試課')).toBeInTheDocument()
  expect(screen.getByText(/9/)).toBeInTheDocument()   // 章節數
})
```

- [ ] **Step 2:跑測試確認失敗**

Run: `npm run test:run -- src/pages/admin/__tests__/AdminCourses.test.jsx`
Expected: FAIL(`AdminCourses` 不存在)

- [ ] **Step 3:實作 `AdminCourses.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminCourses() {
  const [courses, setCourses] = useState([])

  async function fetchCourses() {
    // 課程 + 章節數（章節 = posts.course_id）
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug, cover_url, published, display_order, posts(count)')
    const rows = (data ?? []).map(c => ({
      ...c,
      chapter_count: c.chapter_count ?? c.posts?.[0]?.count ?? 0,
    }))
    rows.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    setCourses(rows)
  }
  useEffect(() => { fetchCourses() }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg font-bold">課程管理</h1>
        <Link to="/admin/courses/new" className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          + 新增課程
        </Link>
      </div>
      <div className="grid gap-3">
        {courses.map(c => (
          <Link key={c.id} to={`/admin/courses/${c.id}`}
            className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
            <div className="w-20 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.title}</div>
              <div className="text-xs text-gray-500">{c.chapter_count} 章 · 順序 {c.display_order}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${c.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {c.published ? '已公開' : '未公開'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

> 註:測試 mock 的 `select` 直接回含 `chapter_count` 的列,故 component 用 `c.chapter_count ?? c.posts?.[0]?.count ?? 0` 兩種都吃。

- [ ] **Step 4:跑測試確認通過**

Run: `npm run test:run -- src/pages/admin/__tests__/AdminCourses.test.jsx`
Expected: PASS

- [ ] **Step 5:Commit**

```bash
git add src/pages/admin/AdminCourses.jsx src/pages/admin/__tests__/AdminCourses.test.jsx
git commit -m "feat(admin): 課程列表頁 AdminCourses"
```

---

## Task 5:章節排序純函式 + `AdminCourseEdit` 編輯頁

### 5a — 排序純函式(TDD)

**Files:**
- Create: `src/pages/admin/courseOrder.js`
- Test: `src/pages/admin/__tests__/courseOrder.test.js`

- [ ] **Step 1:寫失敗測試**

```js
import { describe, it, expect } from 'vitest'
import { moveChapter } from '../courseOrder.js'

const ch = [
  { id: 'a', course_order: 1 }, { id: 'b', course_order: 2 }, { id: 'c', course_order: 3 },
]
describe('moveChapter', () => {
  it('上移交換並重編 order', () => {
    const r = moveChapter(ch, 1, 'up')
    expect(r.map(c => c.id)).toEqual(['b', 'a', 'c'])
    expect(r.map(c => c.course_order)).toEqual([1, 2, 3])
  })
  it('下移', () => {
    expect(moveChapter(ch, 0, 'down').map(c => c.id)).toEqual(['b', 'a', 'c'])
  })
  it('邊界不動', () => {
    expect(moveChapter(ch, 0, 'up')).toBe(ch)
    expect(moveChapter(ch, 2, 'down')).toBe(ch)
  })
})
```

- [ ] **Step 2:跑測試確認失敗**

Run: `npm run test:run -- src/pages/admin/__tests__/courseOrder.test.js`
Expected: FAIL

- [ ] **Step 3:實作 `courseOrder.js`**

```js
// 上/下移一個章節，回新陣列並重編 course_order（1 起）。邊界回原陣列（同參考）。
export function moveChapter(chapters, index, dir) {
  const target = index + (dir === 'up' ? -1 : 1)
  if (target < 0 || target >= chapters.length) return chapters
  const next = [...chapters]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next.map((c, i) => ({ ...c, course_order: i + 1 }))
}
```

- [ ] **Step 4:跑測試確認通過**

Run: `npm run test:run -- src/pages/admin/__tests__/courseOrder.test.js`
Expected: PASS

- [ ] **Step 5:Commit**

```bash
git add src/pages/admin/courseOrder.js src/pages/admin/__tests__/courseOrder.test.js
git commit -m "feat(admin): 章節排序純函式 moveChapter + 測試"
```

### 5b — `AdminCourseEdit.jsx`

**Files:**
- Create: `src/pages/admin/AdminCourseEdit.jsx`

- [ ] **Step 1:實作(鏡像 `AdminPhotoProjectEdit` 的 load/save/cover 上傳)**

```jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUpload } from '../../hooks/useUpload'
import { moveChapter } from './courseOrder'

const EMPTY = { title: '', subtitle: '', description: '', cover_url: '', published: false, display_order: 0, slug: '' }

export default function AdminCourseEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState(EMPTY)
  const [chapters, setChapters] = useState([])
  const [saving, setSaving] = useState(false)
  const { uploading, uploadError, uploadOne } = useUpload()
  const coverRef = useRef(null)
  const chapCoverRefs = useRef({})

  useEffect(() => {
    if (isNew) return
    supabase.from('courses').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data })
    })
    supabase.from('posts')
      .select('id, title, slug, course_order, cover_url, published')
      .eq('course_id', id).order('course_order')
      .then(({ data }) => setChapters(data ?? []))
  }, [id, isNew])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function saveChapterCover(chapterId, url) {
    setChapters(cs => cs.map(c => c.id === chapterId ? { ...c, cover_url: url } : c))
    await supabase.from('posts').update({ cover_url: url }).eq('id', chapterId)
  }

  async function reorder(index, dir) {
    const next = moveChapter(chapters, index, dir)
    if (next === chapters) return
    setChapters(next)
    await Promise.all(next.map(c => supabase.from('posts').update({ course_order: c.course_order }).eq('id', c.id)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title, subtitle: form.subtitle || null, description: form.description || null,
      cover_url: form.cover_url || null, published: form.published,
      display_order: Number(form.display_order) || 0,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-'),
    }
    if (isNew) await supabase.from('courses').insert(payload)
    else await supabase.from('courses').update(payload).eq('id', id)
    setSaving(false)
    navigate('/admin/courses')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <h1 className="text-lg font-bold mb-4">{isNew ? '新增課程' : '編輯課程'}</h1>

      <label className="block text-sm mb-1">課名</label>
      <input name="title" value={form.title} onChange={handleChange} required className="w-full border rounded px-3 py-2 mb-3" />

      <label className="block text-sm mb-1">slug</label>
      <input name="slug" value={form.slug} onChange={handleChange} placeholder="course-xxx" className="w-full border rounded px-3 py-2 mb-3" />

      <label className="block text-sm mb-1">副標</label>
      <input name="subtitle" value={form.subtitle} onChange={handleChange} className="w-full border rounded px-3 py-2 mb-3" />

      <label className="block text-sm mb-1">簡介</label>
      <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full border rounded px-3 py-2 mb-3" />

      <label className="block text-sm mb-1">課程封面</label>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-28 h-20 bg-gray-100 rounded overflow-hidden">
          {form.cover_url && <img src={form.cover_url} alt="封面" className="w-full h-full object-cover" />}
        </div>
        <input type="file" accept="image/*" ref={coverRef} className="hidden"
          onChange={e => { const f = e.target.files[0]; if (f) uploadOne(f, url => setForm(s => ({ ...s, cover_url: url }))) }} />
        <button type="button" disabled={uploading} onClick={() => coverRef.current.click()}
          className="text-xs border px-3 py-2 rounded">{uploading ? '上傳中…' : '上傳封面'}</button>
      </div>
      {uploadError && <p className="text-xs text-red-500 mb-2">{uploadError}</p>}

      <div className="flex items-center gap-2 mb-3">
        <input type="checkbox" name="published" checked={form.published} onChange={handleChange} id="pub" />
        <label htmlFor="pub" className="text-sm">公開（本輪請保持未勾）</label>
      </div>

      <label className="block text-sm mb-1">顯示順序</label>
      <input name="display_order" type="number" value={form.display_order} onChange={handleChange} className="w-28 border rounded px-3 py-2 mb-5" />

      {!isNew && (
        <div className="mb-5">
          <h2 className="text-sm font-bold mb-2">章節（{chapters.length}）</h2>
          <div className="space-y-2">
            {chapters.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 border rounded p-2">
                <span className="text-xs text-gray-400 w-6">{c.course_order}</span>
                <div className="w-14 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <a href={`/admin/posts/${c.id}`} className="flex-1 min-w-0 text-sm truncate hover:underline">{c.title}</a>
                <input type="file" accept="image/*" className="hidden"
                  ref={el => (chapCoverRefs.current[c.id] = el)}
                  onChange={e => { const f = e.target.files[0]; if (f) uploadOne(f, url => saveChapterCover(c.id, url)) }} />
                <button type="button" disabled={uploading} onClick={() => chapCoverRefs.current[c.id].click()}
                  className="text-xs border px-2 py-1 rounded">封面</button>
                <button type="button" onClick={() => reorder(i, 'up')} disabled={i === 0} className="text-xs px-2 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => reorder(i, 'down')} disabled={i === chapters.length - 1} className="text-xs px-2 disabled:opacity-30">↓</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="submit" disabled={saving} className="bg-gray-900 text-white px-5 py-2 rounded text-sm">
        {saving ? '儲存中…' : '儲存'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2:手動檢查渲染** — 暫時跑 `npm run dev`,Task 6 接好 route 後在 `/admin/courses/<id>` 開。本步先確認 import 無誤:

Run: `npm run test:run -- src/pages/admin/__tests__/courseOrder.test.js`(確認共用的 moveChapter 仍綠)
Expected: PASS

- [ ] **Step 3:Commit**

```bash
git add src/pages/admin/AdminCourseEdit.jsx
git commit -m "feat(admin): 課程編輯頁 AdminCourseEdit（封面/章節封面/排序）"
```

---

## Task 6:接線 — route + nav

**Files:**
- Modify: `src/App.jsx`(admin route 區、lazy import 區)
- Modify: `src/pages/admin/AdminLayout.jsx`(nav)

- [ ] **Step 1:`App.jsx` 加 lazy import(放 AdminPhotoProjectEdit import 附近)**

```jsx
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'))
const AdminCourseEdit = lazy(() => import('./pages/admin/AdminCourseEdit'))
```

- [ ] **Step 2:`App.jsx` 加 route(放 photo-projects route 後)**

```jsx
          <Route path="courses" element={<AdminCourses />} />
          <Route path="courses/:id" element={<AdminCourseEdit />} />
```

- [ ] **Step 3:`AdminLayout.jsx` 加 nav(在 `📝 文章管理` 那行後)**

```jsx
          <NavLink to="/admin/courses" className={navClass}>🎓 課程管理</NavLink>
```

- [ ] **Step 4:整體測試 + build 確認無破壞**

Run: `npm run test:run`
Expected: 全綠(含既有 admin 測試)
Run: `npm run build`
Expected:build 成功,無 import 錯誤。

- [ ] **Step 5:Commit**

```bash
git add src/App.jsx src/pages/admin/AdminLayout.jsx
git commit -m "feat(admin): 接線 課程管理 route 與側欄"
```

---

## Task 7:真跑 seed + 後台驗收

**Files:** 無(執行 + 驗證)

- [ ] **Step 1:套用 schema** — 確認 Task 1 的 SQL 已在 Supabase 執行(`SELECT count(*) FROM courses;` 可跑)。

- [ ] **Step 2:真跑 seed**

Run: `VITE_SERVICE_ROLE_KEY=$(grep VITE_SERVICE_ROLE_KEY .env.local | cut -d= -f2) node scripts/seed-courses.mjs`
Expected:6 門課 + 各章 `insert`,結尾「完成。」

- [ ] **Step 3:DB 驗證**

```sql
SELECT slug, title, display_order FROM courses ORDER BY display_order;     -- 6 列
SELECT course_id, count(*) FROM posts WHERE course_id IS NOT NULL GROUP BY course_id;  -- 各課章節數
SELECT count(*) FROM posts WHERE course_id IS NOT NULL AND published = true;            -- 預期 0（全 draft）
```

- [ ] **Step 4:冪等驗證** — 再跑一次 seed:

Run: `VITE_SERVICE_ROLE_KEY=$(grep VITE_SERVICE_ROLE_KEY .env.local | cut -d= -f2) node scripts/seed-courses.mjs`
Expected:章節全部「已存在 → 跳過」,DB 章節數不變。

- [ ] **Step 5:後台驗收** — `npm run dev` → `/admin/courses`:
  - 看到 6 門課、章節數正確、全部「未公開」。
  - 進一門課:上課程封面、上一章封面、上移/下移章節 → 重整後仍在。
  - 點章名 → 跳 `/admin/posts/:id` 能編輯內文。
  - 公開端確認:登出狀態開 `/blog`,課程章節不出現(全 draft)。

- [ ] **Step 6:無 code 變更則免 commit;若驗收中修了 bug,逐項 commit。**

---

## Self-Review(計畫對 spec)

- **Spec §三 資料模型**:courses 表(Task 1)、posts 三欄(Task 1)、slug 策略(Task 2 `chapterSlug`)✓
- **Spec §二 安全**:章節 `published=false`(Task 3 payload)、courses RLS(Task 1 Step 3)、Task 7 Step 5 公開端驗收 ✓
- **Spec §四 seed 冪等非破壞**:Task 3 已存在跳過/保留封面;Task 7 Step 4 冪等驗證 ✓
- **Spec §五 後台頁**:list(Task 4)、edit + 封面 + 章節封面 + 排序(Task 5)、章名連 AdminPostEdit(Task 5b a 標籤)、接線(Task 6)✓
- **Spec §六 測試**:seed 純函式(Task 2)、AdminCourses 渲染(Task 4)、排序純函式(Task 5a)✓
- **Placeholder 掃描**:各 step 有完整 code/SQL/指令,無 TBD ✓
- **型別一致**:`moveChapter(chapters,index,dir)` Task 5a 定義、5b 使用一致;`parseChapterFile`/`chapterSlug` Task 2 定義、Task 3 使用一致;欄位名 `course_id`/`course_order`/`cover_url` 全 Task 一致 ✓
- **已知取捨**:`AdminCourses` 章節數查詢用 `posts(count)` 巢狀關聯,真實 Supabase 行為若與 mock 不同,Task 7 Step 5 驗收會抓到,屆時改成各課一次 count 查詢。
