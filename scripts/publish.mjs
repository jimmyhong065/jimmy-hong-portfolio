// scripts/publish.mjs
// 發布文章或整個系列：標點正規化 → 檢查 frontmatter/同名衝突 → frontmatter 設 status: published → 寫 Supabase。
// 用法：npm run publish -- <slug|檔案路徑|course-xxx> [...更多] [--dry-run] [--yes]
//   slug          一般文章（docs/<slug>.md 或 docs/drafts/<slug>.md）或系列文章 slug（如 bughunt-a01-reverse-thinking）
//   course-xxx    整個系列：全部文章 + 系列頁（courses.published）
//   --dry-run     只印計畫，不改檔、不寫 DB
//   --yes         跳過確認
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, readdirSync, writeFileSync, unlinkSync, statSync } from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { parseChapterFile, chapterSlug } from './lib/courseSeed.js'
import { normalizePunctuation, setField, validateArticle, articleFields, isEditedInAdmin } from './lib/publishCore.js'

const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const SITE = 'https://qa-lens.com'
const DOCS = 'docs'
const DRAFTS = join(DOCS, 'drafts')

function loadEnv() {
  const env = { ...process.env }
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const i = line.indexOf('=')
      if (i > 0 && !(line.slice(0, i).trim() in env)) env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
  } catch {}
  return env
}

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const YES = args.includes('--yes')
const targets = args.filter(a => !a.startsWith('--'))
if (!targets.length) {
  console.error('用法：npm run publish -- <slug|檔案路徑|course-xxx> [...] [--dry-run] [--yes]')
  process.exit(1)
}

const courseDirs = readdirSync(DOCS).filter(d => d.startsWith('course-') && statSync(join(DOCS, d)).isDirectory())

// 把一個參數展開成 [{ file, slug, course?, order? }]
function resolve(arg) {
  const name = basename(arg.replace(/\/$/, ''))
  if (courseDirs.includes(name)) {
    return readdirSync(join(DOCS, name))
      .filter(f => parseChapterFile(f)).sort()
      .map(f => ({ file: join(DOCS, name, f), slug: chapterSlug(name, f), course: name, order: parseChapterFile(f).order }))
  }
  const slug = basename(name, '.md')
  // 系列文章（路徑或 slug）
  for (const c of courseDirs) {
    for (const f of readdirSync(join(DOCS, c)).filter(f => parseChapterFile(f))) {
      if (arg === join(DOCS, c, f) || slug === f.replace(/\.md$/, '') || slug === chapterSlug(c, f)) {
        return [{ file: join(DOCS, c, f), slug: chapterSlug(c, f), course: c, order: parseChapterFile(f).order }]
      }
    }
  }
  const inDocs = join(DOCS, `${slug}.md`)
  const inDrafts = join(DRAFTS, `${slug}.md`)
  if (existsSync(inDocs) && existsSync(inDrafts)) {
    throw new Error(`${slug}：docs/ 與 docs/drafts/ 都有同名檔，請先刪掉其中一份`)
  }
  if (existsSync(inDocs)) return [{ file: inDocs, slug }]
  if (existsSync(inDrafts)) return [{ file: inDrafts, slug }]
  throw new Error(`找不到 ${arg}`)
}

// ── 1. 解析目標 + 本地檢查（任何一篇有錯就整批不動）
let items
try {
  items = targets.flatMap(resolve)
} catch (e) {
  console.error(`❌ ${e.message}`)
  process.exit(1)
}

const problems = []
for (const it of items) {
  const raw = readFileSync(it.file, 'utf8')
  it.original = articleFields(raw).content
  it.next = setField(normalizePunctuation(raw), 'status', 'published')
  it.punctChanged = normalizePunctuation(raw) !== raw
  it.fields = articleFields(it.next)
}

// ── 2. 對照 DB
const env = loadEnv()
const KEY = env.VITE_SERVICE_ROLE_KEY
if (!KEY) { console.error('缺 VITE_SERVICE_ROLE_KEY（.env.local）'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, KEY)

const { data: rows, error } = await supabase
  .from('posts').select('id, slug, content, tags, published, published_at')
  .in('slug', items.map(i => i.slug))
if (error) { console.error('❌ 讀取 posts 失敗：', error.message); process.exit(1) }
const bySlug = Object.fromEntries(rows.map(r => [r.slug, r]))

const courses = [...new Set(items.map(i => i.course).filter(Boolean))]
// 只有傳整個系列資料夾才讓系列頁上線；單發一篇不動系列頁
const wholeCourses = targets.map(t => basename(t.replace(/\/$/, ''))).filter(n => courseDirs.includes(n))
const courseIds = {}
if (courses.length) {
  const { data } = await supabase.from('courses').select('id, slug, published').in('slug', courses)
  for (const c of data ?? []) courseIds[c.slug] = c
  const missing = courses.filter(c => !courseIds[c])
  if (missing.length) {
    console.error(`❌ 系列不在 DB：${missing.join(', ')}（先跑 node scripts/seed-courses.mjs）`)
    process.exit(1)
  }
}

for (const it of items) {
  const row = bySlug[it.slug]
  // DB 已有 tags 的文章，frontmatter 沒寫 tags 也可以
  for (const err of validateArticle(it.next)) {
    if (err === '缺 tags' && row?.tags?.length) continue
    problems.push(`${it.file}：${err}`)
  }
  it.action = !row ? 'insert' : row.published ? 'update' : 'publish'
  // 跟「原始檔案」比，才看得出 DB 是否被另外改過（標點正規化不算）
  it.contentChanged = row ? row.content !== it.original : true
  // 後台編輯過（HTML）：只切發布狀態，不覆寫內容
  it.keepDbContent = row ? isEditedInAdmin(row.content) : false
}

if (problems.length) {
  console.error('❌ 檢查未通過，沒有任何變更：\n' + problems.map(p => '  - ' + p).join('\n'))
  process.exit(1)
}

// ── 3. 印計畫
const label = { insert: '🆕 新增並發布', publish: '🚀 草稿→發布', update: '✏️  已發布，更新內容' }
console.log(`\n計畫（${items.length} 篇）：`)
for (const it of items) {
  const notes = [
    it.file.startsWith(DRAFTS) && '移出 drafts/',
    it.punctChanged && '標點正規化',
    it.keepDbContent && '已在後台編輯，保留 DB 內容',
    it.action !== 'insert' && !it.keepDbContent && it.contentChanged && '⚠️ 內容與 DB 不同，會以檔案覆寫',
  ].filter(Boolean)
  console.log(`  ${label[it.action]}  ${it.slug}${notes.length ? '  (' + notes.join('、') + ')' : ''}`)
}
for (const c of wholeCourses) if (!courseIds[c].published) console.log(`  📚 系列頁上線  ${c}`)

if (DRY) { console.log('\n--dry-run：沒有任何變更。'); process.exit(0) }
if (!YES) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ans = await rl.question('\n確定發布？(y/N) ')
  rl.close()
  if (ans.trim().toLowerCase() !== 'y') { console.log('已取消。'); process.exit(0) }
}

// ── 4. 執行
const now = new Date().toISOString()
const failed = []
for (const it of items) {
  const row = bySlug[it.slug]
  const payload = {
    ...(it.keepDbContent ? {} : it.fields),
    published: true,
    published_at: row?.published_at ?? now,
    ...(it.course ? { course_id: courseIds[it.course].id, course_order: it.order } : {}),
  }
  const { error } = row
    ? await supabase.from('posts').update(payload).eq('id', row.id)
    : await supabase.from('posts').insert({ slug: it.slug, ...payload })
  if (error) { failed.push(`${it.slug}：${error.message}`); continue }

  // DB 成功才改檔
  const dest = it.file.startsWith(DRAFTS) ? join(DOCS, basename(it.file)) : it.file
  writeFileSync(dest, it.next)
  if (dest !== it.file) unlinkSync(it.file)
  it.done = true
}
for (const c of wholeCourses) {
  if (courseIds[c].published) continue
  const { error } = await supabase.from('courses').update({ published: true }).eq('id', courseIds[c].id)
  if (error) failed.push(`系列 ${c}：${error.message}`)
}

// ── 5. 摘要
const newly = items.filter(i => i.done && i.action !== 'update')
const updated = items.filter(i => i.done && i.action === 'update')
console.log(`\n✅ 新發布 ${newly.length} 篇：`)
for (const i of newly) console.log(`  - ${i.fields.title}\n    ${SITE}/blog/${i.slug}`)
if (updated.length) console.log(`✏️  更新內容 ${updated.length} 篇：${updated.map(i => i.slug).join(', ')}`)
if (failed.length) console.log(`❌ 失敗 ${failed.length}：\n` + failed.map(f => '  - ' + f).join('\n'))
console.log(`\n下一步：git add ${[...new Set(items.map(i => dirname(i.file)))].join(' ')} && git commit && git push（部署時會重產 sitemap）`)
process.exit(failed.length ? 1 : 0)
