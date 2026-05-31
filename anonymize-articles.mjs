import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sfzewfqqxvahnhjxstsw.supabase.co',
  'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
)

// Sign in
const { error: authError } = await supabase.auth.signInWithPassword({
  email: process.env.VITE_ADMIN_EMAIL,
  password: process.env.ADMIN_PASS,
})
if (authError) { console.error('登入失敗:', authError.message); process.exit(1) }
console.log('✅ 登入成功\n')

// Replacement rules — order matters (longer strings first)
const REPLACEMENTS = [
  // URLs
  ['staging.forestfocus.app', 'staging.example.com'],
  ['api.forestfocus.app', 'api.example.com'],
  ['app.forestfocus.app', 'app.example.com'],
  ['forestfocus.app', 'example.com'],
  ['forestfocus://', 'app://'],

  // Email
  ['@forestfocus.app', '@example.com'],

  // Brand name (various capitalizations)
  ['Forest Focus', '我們的 App'],
  ['ForestFocus', 'OurApp'],
  ['forest focus', '我們的 App'],

  // Internal service names
  ['forest-service', '主功能服務'],
  ['reward-service', '獎勵服務'],
  ['timer-service', '計時服務'],
  ['forest_service', 'main_service'],
  ['reward_service', 'reward_service'],  // keep in code
  ['timer_service', 'timer_service'],    // keep in code

  // Internal Slack channel
  ['#seekrtech_qa_team', '#qa-team'],
  ['seekrtech', 'company'],

  // Internal DB fields that reveal product
  ['forest_id', 'item_id'],
  ['`forestfocus`', '`ourapp`'],
]

function anonymize(content) {
  let result = content
  for (const [from, to] of REPLACEMENTS) {
    result = result.replaceAll(from, to)
  }
  return result
}

function extractTitle(content) {
  const match = content.match(/^# (.+)/m)
  return match ? match[1].replace(/[`*_]/g, '').trim() : ''
}

function extractExcerpt(content) {
  const lines = content.split('\n')
  for (const line of lines) {
    const l = line.trim()
    if (!l || l.startsWith('#') || l.startsWith('>') || l.startsWith('---') ||
        l.startsWith('-') || l.startsWith('1.') || l.startsWith('|') ||
        l.startsWith('!') || l.startsWith('```')) continue
    if (l.length > 20) return l.slice(0, 200)
  }
  return ''
}

const draftsDir = '/Users/jimmyhong/Desktop/qa_self_blog/docs/drafts'
const files = readdirSync(draftsDir).filter(f => f.endsWith('.md'))

let changed = 0
let unchanged = 0

for (const filename of files) {
  const filePath = join(draftsDir, filename)
  const original = readFileSync(filePath, 'utf-8')
  const anonymized = anonymize(original)
  const slug = filename.replace('.md', '')

  const hasChanges = original !== anonymized

  // Write back to local file
  if (hasChanges) {
    writeFileSync(filePath, anonymized, 'utf-8')
    changed++
  } else {
    unchanged++
  }

  // Re-upload to Supabase
  const title = extractTitle(anonymized)
  const excerpt = extractExcerpt(anonymized)

  const { error } = await supabase
    .from('posts')
    .upsert({
      title,
      slug,
      content: anonymized,
      excerpt,
      tags: [],
      published: false,
      published_at: null,
    }, { onConflict: 'slug' })

  const icon = error ? '❌' : (hasChanges ? '🔄' : '✅')
  const note = error ? error.message : (hasChanges ? '已匿名化並更新' : '無需修改')
  console.log(`${icon} ${slug.padEnd(45)} ${note}`)
}

console.log(`\n完成！已修改 ${changed} 篇，無需修改 ${unchanged} 篇`)
