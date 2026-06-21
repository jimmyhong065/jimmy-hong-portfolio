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
