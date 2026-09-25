// upload-articles.mjs
// 把「指定的」markdown 檔同步到 Supabase，只動內容，不動發布狀態。
//   已存在的文章：更新 title/content/excerpt/tags
//   新文章：以草稿新增（發布請用 npm run publish）
//   課程章節：只更新已存在的章節（新章節請跑 scripts/seed-courses.mjs）
// 用法：node upload-articles.mjs docs/foo.md docs/course-api/article-A01-x.md ...
// CI（.github/workflows/publish-articles.yml）會傳入這次 push 有變動的檔案。
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { chapterSlug } from './scripts/lib/courseSeed.js'
import { articleFields, isEditedInAdmin } from './scripts/lib/publishCore.js'

const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const ANON_KEY = 'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'

// docs/foo.md、docs/drafts/foo.md → 一般文章；docs/course-x/article-A01-y.md → 課程章節；其他略過
function classify(path) {
  let m = path.match(/^docs\/(?:drafts\/)?([^/]+)\.md$/)
  if (m) return { slug: m[1], chapter: false }
  m = path.match(/^docs\/(course-[^/]+)\/(article-[A-Za-z]+\d+-[^/]+\.md)$/)
  if (m) return { slug: chapterSlug(m[1], m[2]), chapter: true }
  return null
}

const files = process.argv.slice(2).filter(f => f.endsWith('.md'))
if (!files.length) {
  console.log('沒有要同步的檔案。用法：node upload-articles.mjs <file.md> [...]')
  process.exit(0)
}

const serviceKey = process.env.VITE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, serviceKey || ANON_KEY)
if (!serviceKey) {
  const password = process.env.ADMIN_PASS
  if (!password) { console.error('請設定 ADMIN_PASS 或 VITE_SERVICE_ROLE_KEY'); process.exit(1) }
  const email = process.env.VITE_ADMIN_EMAIL || 'rbingwork1030@gmail.com'
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) { console.error('登入失敗:', error.message); process.exit(1) }
}

let failed = 0
for (const path of files) {
  const kind = classify(path)
  if (!kind) { console.log(`⏭  略過（非文章）：${path}`); continue }
  if (!existsSync(path)) { console.log(`⏭  略過（已刪除）：${path}`); continue }

  const fields = articleFields(readFileSync(path, 'utf8'))
  if (!fields.title) { console.log(`⏭  略過（無標題）：${path}`); continue }

  const { data: existing } = await supabase.from('posts').select('id, content').eq('slug', kind.slug).maybeSingle()
  let error
  if (existing && isEditedInAdmin(existing.content)) {
    console.log(`⚠️  略過（已在後台編輯，DB 為 HTML，不用 repo 覆寫）：${kind.slug}`)
  } else if (existing) {
    ({ error } = await supabase.from('posts').update(fields).eq('id', existing.id))
    if (!error) console.log(`✏️  內容更新：${kind.slug}`)
  } else if (kind.chapter) {
    console.log(`⏭  略過（章節不在 DB，先跑 seed-courses）：${kind.slug}`)
  } else {
    ({ error } = await supabase.from('posts').insert({ slug: kind.slug, ...fields, published: false, published_at: null }))
    if (!error) console.log(`🆕 新增草稿：${kind.slug}`)
  }
  if (error) { failed++; console.error(`❌ ${kind.slug}: ${error.message}`) }
}
process.exit(failed ? 1 : 0)
