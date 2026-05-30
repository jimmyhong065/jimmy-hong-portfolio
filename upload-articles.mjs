import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'

const supabase = createClient(
  'https://sfzewfqqxvahnhjxstsw.supabase.co',
  'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
)

function extractTitle(content) {
  const match = content.match(/^# (.+)/m)
  return match ? match[1].replace(/[`*_]/g, '').trim() : ''
}

function extractExcerpt(content) {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    if (line.startsWith('#') || line.startsWith('>') || line.startsWith('---') ||
        line.startsWith('1.') || line.startsWith('-') || line.startsWith('|') ||
        line.startsWith('!') || line.startsWith('```')) continue
    if (line.length > 20) return line.slice(0, 200)
  }
  return ''
}

function filenameToSlug(filePath) {
  return basename(filePath, '.md')
}

async function uploadArticle({ filePath, published }) {
  const content = readFileSync(filePath, 'utf-8')
  const title = extractTitle(content)
  const slug = filenameToSlug(filePath)
  const excerpt = extractExcerpt(content)

  if (!title) {
    console.log(`⏭  跳過（無標題）: ${slug}`)
    return
  }

  const payload = {
    title,
    slug,
    content,
    excerpt,
    published,
    published_at: published ? new Date().toISOString() : null,
  }

  const { error } = await supabase
    .from('posts')
    .upsert(payload, { onConflict: 'slug' })

  if (error) {
    console.error(`❌ ${slug}: ${error.message}`)
  } else {
    console.log(`${published ? '✅ [發佈]' : '📝 [草稿]'} ${title}`)
  }
}

// Sign in as admin
const email = process.env.VITE_ADMIN_EMAIL || 'rbingwork1030@gmail.com'
const password = process.env.ADMIN_PASS
if (!password) { console.error('請設定 ADMIN_PASS 環境變數'); process.exit(1) }

const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
if (authError) { console.error('登入失敗:', authError.message); process.exit(1) }
console.log('✅ 登入成功')

const docsDir = '/Users/jimmyhong/Desktop/qa_self_blog/docs'
const draftsDir = '/Users/jimmyhong/Desktop/qa_self_blog/docs/drafts'

const published = [
  join(docsDir, 'appium-article-revised.md'),
  join(docsDir, 'k6-article-revised.md'),
]

const drafts = readdirSync(draftsDir)
  .filter(f => f.endsWith('.md'))
  .map(f => join(draftsDir, f))

console.log(`\n🚀 上傳修訂版文章（${published.length} 篇，直接發佈）...`)
for (const f of published) await uploadArticle({ filePath: f, published: true })

console.log(`\n📝 上傳草稿文章（${drafts.length} 篇）...`)
for (const f of drafts) await uploadArticle({ filePath: f, published: false })

console.log('\n✨ 完成！')
