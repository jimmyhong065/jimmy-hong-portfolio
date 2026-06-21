import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, basename } from 'path'

const supabase = createClient(
  'https://sfzewfqqxvahnhjxstsw.supabase.co',
  'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
)

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return { body: content, tags: null }
  const fm = match[1]
  const tagsMatch = fm.match(/^tags:\s*\[([^\]]*)\]/m)
  const tags = tagsMatch
    ? tagsMatch[1].split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
    : null
  return { body: content.slice(match[0].length), tags }
}

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

// REVIEW_MODE=1：只更新內容，不動 published 狀態（新文章留草稿，已發布文章保持發布）
const REVIEW_MODE = process.env.REVIEW_MODE === '1'

async function uploadArticle({ filePath, published }) {
  const raw = readFileSync(filePath, 'utf-8')
  const { body: content, tags } = parseFrontmatter(raw)
  const title = extractTitle(content)
  const slug = filenameToSlug(filePath)
  const excerpt = extractExcerpt(content)

  if (!title) {
    console.log(`⏭  跳過（無標題）: ${slug}`)
    return
  }

  const shouldPublish = published && !REVIEW_MODE

  const payload = {
    title,
    slug,
    content,
    excerpt,
    // 只有明確發布且非 REVIEW_MODE 才帶 published 欄位
    ...(shouldPublish ? { published: true, published_at: new Date().toISOString() } : {}),
    ...(tags ? { tags } : {}),
  }

  const { error } = await supabase
    .from('posts')
    .upsert(payload, { onConflict: 'slug' })

  if (error) {
    console.error(`❌ ${slug}: ${error.message}`)
  } else {
    const label = shouldPublish ? '✅ [發佈]' : REVIEW_MODE ? '👀 [待審]' : '📝 [草稿]'
    console.log(`${label} ${title}`)
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
  join(docsDir, 'qa-leader-ic-collaboration.md'),
  join(docsDir, 'automation-business-value.md'),
  join(docsDir, 'tau-test-automation-foundation.md'),
  join(docsDir, 'tau-observability-for-test-automation.md'),
  join(docsDir, 'tau-performance-load-testing.md'),
  join(docsDir, 'tau-whole-team-continuous-testing.md'),
  join(docsDir, 'tau-pytest-tutorial.md'),
  join(docsDir, 'tau-github-actions-for-testing.md'),
  join(docsDir, 'tau-pytest-bdd.md'),
  join(docsDir, 'swe-at-google-startup.md'),
  join(docsDir, 'appium-self-healing-framework.md'),
  join(docsDir, 'automated-testing-strategy.md'),
  join(docsDir, 'tau-building-quality-leaders.md'),
  join(docsDir, 'tau-unit-testing.md'),
  join(docsDir, 'tau-test-automation-in-devops.md'),
  join(docsDir, 'user-story-mapping-qa.md'),
  join(docsDir, 'qa-problem-solving-six-steps.md'),
  join(docsDir, 'when-not-to-automate.md'),
  join(docsDir, 'qa-pm-test-strategy-alignment.md'),
  join(docsDir, 'qa-influence-architecture.md'),
  join(docsDir, 'tau-playwright-advanced.md'),
  join(docsDir, 'domain-knowledge-ai-era.md'),
  join(docsDir, 'why-testing-problems-never-get-solved.md'),
  join(docsDir, 'github-actions-vs-jenkins.md'),
  join(docsDir, 'ci-test-too-slow.md'),
  join(docsDir, 'appium-pytest-integration.md'),
  join(docsDir, 'mobile-testing-harder-than-web.md'),
  // 2026-06-17 新增：15 篇技術實戰文章
  join(docsDir, 'api-testing-automation.md'),
  join(docsDir, 'app-automation-strategy.md'),
  join(docsDir, 'appium-2-to-3-migration.md'),
  join(docsDir, 'appium-github-actions.md'),
  join(docsDir, 'database-migration-testing.md'),
  join(docsDir, 'deep-link-testing.md'),
  join(docsDir, 'hotfix-testing.md'),
  join(docsDir, 'iap-testing.md'),
  join(docsDir, 'maestro-vs-appium.md'),
  join(docsDir, 'multi-framework-strategy.md'),
  join(docsDir, 'offline-network-testing.md'),
  join(docsDir, 'opentelemetry-for-qa.md'),
  join(docsDir, 'performance-testing-k6.md'),
  join(docsDir, 'playwright-vs-appium.md'),
  // 2026-06-17 新增：53 篇優化草稿正式發布
  join(docsDir, 'ai-replaced-qa-6m-loss.md'),
  join(docsDir, 'ai-system-testing-blind-spots.md'),
  join(docsDir, 'ai-test-case-design.md'),
  join(docsDir, 'api-contract-undefined.md'),
  join(docsDir, 'api-testing-strategy.md'),
  join(docsDir, 'bug-report-clarity.md'),
  join(docsDir, 'bug-vs-spec-problem.md'),
  join(docsDir, 'cache-testing.md'),
  join(docsDir, 'claude-code-qa-workflow.md'),
  join(docsDir, 'contract-testing.md'),
  join(docsDir, 'event-driven-testing.md'),
  join(docsDir, 'faster-release-more-bugs.md'),
  join(docsDir, 'feature-flag-testing.md'),
  join(docsDir, 'flaky-test-self-healing.md'),
  join(docsDir, 'github-actions-qa-intro.md'),
  join(docsDir, 'llm-wiki-test-cases.md'),
  join(docsDir, 'po-qa-collaboration.md'),
  join(docsDir, 'proxyman-for-qa.md'),
  join(docsDir, 'proxyman-mitm-principle.md'),
  join(docsDir, 'push-notification-testing.md'),
  join(docsDir, 'qa-blocker-label.md'),
  join(docsDir, 'qa-brain.md'),
  join(docsDir, 'qa-communication-skills.md'),
  join(docsDir, 'qa-from-zero-startup.md'),
  join(docsDir, 'qa-in-code-review.md'),
  join(docsDir, 'qa-metrics-for-managers.md'),
  join(docsDir, 'qa-onboarding-new-product.md'),
  join(docsDir, 'qa-portal.md'),
  join(docsDir, 'qa-process-efficiency.md'),
  join(docsDir, 'qa-rd-trust.md'),
  join(docsDir, 'qa-team-collaboration.md'),
  join(docsDir, 'qa-testing-llm.md'),
  join(docsDir, 'qa-to-rd-ratio.md'),
  join(docsDir, 'rd-reduce-flaky-bugs.md'),
  join(docsDir, 'release-timing-disaster.md'),
  join(docsDir, 'reportportal-auto-analysis.md'),
  join(docsDir, 'retro-effective-communication.md'),
  join(docsDir, 'risk-based-testing-max-value.md'),
  join(docsDir, 'routine-change-risk.md'),
  join(docsDir, 'sbtm-exploratory-testing.md'),
  join(docsDir, 'security-testing-basics.md'),
  join(docsDir, 'shift-left-paradox.md'),
  join(docsDir, 'shift-left-right-testing.md'),
  join(docsDir, 'skip-qa-release.md'),
  join(docsDir, 'slack-command-for-qa.md'),
  join(docsDir, 'spof-life-design.md'),
  join(docsDir, 'test-data-management.md'),
  join(docsDir, 'test-debt.md'),
  join(docsDir, 'testing-ai-generated-code.md'),
  join(docsDir, 'unit-test-100-but-qa-finds-bugs.md'),
  join(docsDir, 'vision-ai-mobile-testing.md'),
  join(docsDir, 'visual-regression-testing.md'),
  join(docsDir, 'when-to-ship.md'),
  join(docsDir, 'http-for-qa.md'),
]

const drafts = readdirSync(draftsDir)
  .filter(f => f.endsWith('.md'))
  .map(f => join(draftsDir, f))

console.log(`\n🚀 上傳修訂版文章（${published.length} 篇，直接發佈）...`)
for (const f of published) await uploadArticle({ filePath: f, published: true })

console.log(`\n📝 上傳草稿文章（${drafts.length} 篇）...`)
for (const f of drafts) await uploadArticle({ filePath: f, published: false })

await generateSitemap()
console.log('\n✨ 完成！')

async function generateSitemap() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('slug, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('❌ Sitemap 生成失敗:', error.message)
    return
  }

  const SITE = 'https://qa-lens.com'

  const staticPages = [
    { loc: '/',         changefreq: 'daily',   priority: '1.0' },
    { loc: '/blog',     changefreq: 'daily',   priority: '0.9' },
    { loc: '/projects', changefreq: 'weekly',  priority: '0.9' },
    { loc: '/photo',    changefreq: 'weekly',  priority: '0.8' },
    { loc: '/about',    changefreq: 'monthly', priority: '0.7' },
    { loc: '/services', changefreq: 'monthly', priority: '0.7' },
    { loc: '/faq',      changefreq: 'monthly', priority: '0.6' },
  ]

  const staticEntries = staticPages.map(p =>
    `  <url>\n    <loc>${SITE}${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
  )

  const articleEntries = posts.map(p => {
    const lastmod = (p.published_at ?? '').slice(0, 10)
    return `  <url>\n    <loc>${SITE}/blog/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...articleEntries].join('\n')}\n</urlset>`

  const sitemapPath = join(docsDir, '..', 'public', 'sitemap.xml')
  writeFileSync(sitemapPath, xml, 'utf-8')
  console.log(`\n🗺  Sitemap 已更新（${posts.length} 篇文章）`)
}
