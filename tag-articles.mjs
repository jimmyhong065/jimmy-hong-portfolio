import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sfzewfqqxvahnhjxstsw.supabase.co',
  'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
)

const { error: authError } = await supabase.auth.signInWithPassword({
  email: process.env.VITE_ADMIN_EMAIL,
  password: process.env.ADMIN_PASS,
})
if (authError) { console.error('登入失敗:', authError.message); process.exit(1) }
console.log('✅ 登入成功\n')

const TAGS = {
  // 已發布
  'appium-article-revised':          ['自動化測試', '行動應用', 'Appium', '工具'],
  'k6-article-revised':              ['效能測試', '工具', 'k6'],

  // 草稿
  '2026-05-16-draft':                ['測試策略', 'Bug Report'],
  'ai-test-case-design':             ['AI', 'LLM', '測試策略'],
  'api-contract-undefined':          ['API 測試', '測試策略', '協作'],
  'api-testing-automation':          ['API 測試', '自動化測試', '工具'],
  'api-testing-strategy':            ['API 測試', '測試策略'],
  'app-automation-strategy':         ['自動化測試', '行動應用', 'CI/CD'],
  'automation-business-value':       ['自動化測試', '流程', '職涯'],
  'bug-vs-spec-problem':             ['測試策略', '協作'],
  'cache-testing':                   ['測試策略', '工具'],
  'contract-testing':                ['API 測試', '整合測試'],
  'database-migration-testing':      ['測試策略', '資料庫'],
  'deep-link-testing':               ['行動應用', '測試策略'],
  'domain-knowledge-ai-era':         ['AI', '測試策略', '職涯'],
  'event-driven-testing':            ['測試策略', '整合測試'],
  'faster-release-more-bugs':        ['測試策略', '流程', 'CI/CD'],
  'feature-flag-testing':            ['測試策略', 'CI/CD'],
  'hotfix-testing':                  ['測試策略', '流程'],
  'iap-testing':                     ['行動應用', '測試策略'],
  'llm-wiki-test-cases':             ['AI', 'LLM', '測試策略'],
  'offline-network-testing':         ['行動應用', '測試策略', '工具'],
  'opentelemetry-for-qa':            ['觀測性', '工具'],
  'performance-testing-k6':          ['效能測試', '工具', 'k6'],
  'playwright-vs-appium':            ['自動化測試', '行動應用', '工具'],
  'proxyman-for-qa':                 ['工具', 'API 測試'],
  'proxyman-mitm-principle':         ['工具', '安全測試'],
  'push-notification-testing':       ['行動應用', '測試策略'],
  'qa-blocker-label':                ['流程', '協作'],
  'qa-brain':                        ['AI', '測試策略', '工具'],
  'qa-from-zero-startup':            ['測試策略', '流程', '職涯'],
  'qa-in-code-review':               ['協作', '流程'],
  'qa-metrics-for-managers':         ['流程', '職涯'],
  'qa-onboarding-new-product':       ['流程', '職涯'],
  'qa-portal':                       ['工具', '流程'],
  'qa-process-efficiency':           ['流程', '測試策略'],
  'qa-team-collaboration':           ['協作', '流程'],
  'qa-testing-llm':                  ['AI', 'LLM', '測試策略'],
  'qa-to-rd-ratio':                  ['流程', '職涯', '協作'],
  'rd-reduce-flaky-bugs':            ['自動化測試', '協作'],
  'risk-based-testing-max-value':    ['測試策略', '流程'],
  'security-testing-basics':         ['安全測試', '測試策略'],
  'shift-left-right-testing':        ['測試策略', '流程'],
  'slack-command-for-qa':            ['工具', '流程', '自動化測試'],
  'test-data-management':            ['測試資料', '測試策略'],
  'test-debt':                       ['流程', '測試策略'],
  'unit-test-100-but-qa-finds-bugs': ['單元測試', '整合測試', '測試策略'],
  'visual-regression-testing':       ['自動化測試', '工具'],
  'when-to-ship':                    ['測試策略', '流程', '協作'],
  'bug-report-clarity':              ['Bug Report', '協作', '流程'],
  'qa-communication-skills':         ['協作', '職涯', '流程'],
}

let ok = 0, fail = 0

for (const [slug, tags] of Object.entries(TAGS)) {
  const { error } = await supabase
    .from('posts')
    .update({ tags })
    .eq('slug', slug)

  if (error) {
    console.log(`❌ ${slug}: ${error.message}`)
    fail++
  } else {
    console.log(`✅ ${slug.padEnd(45)} [${tags.join(', ')}]`)
    ok++
  }
}

console.log(`\n完成！${ok} 篇標籤已更新，${fail} 篇失敗`)
