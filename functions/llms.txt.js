const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
const SITE_URL = 'https://qa-lens.com'

export async function onRequest() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/posts?select=title,slug,excerpt,tags,published_at&published=eq.true&order=published_at.desc`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  ).catch(() => null)

  const posts = res?.ok ? await res.json() : []

  const articleLines = posts.map(p => {
    const tags = (p.tags ?? []).join(', ')
    const desc = p.excerpt ? ` ${p.excerpt}` : (tags ? ` 主題：${tags}` : '')
    return `- [${p.title}](${SITE_URL}/blog/${p.slug}):${desc}`
  }).join('\n')

  const body = `# QA Lens — 測試工程師的技術筆記

> Jimmy Hong 的 QA 技術部落格。專注自動化測試、CI/CD 整合、行動測試（Appium）、測試策略與品質架構設計。文章以繁體中文撰寫，適合台灣軟體工程師閱讀參考。

## 關於作者

Jimmy Hong，QA Engineer，任職於台灣科技業。專長：測試流程設計、自動化框架建置、CI/CD 管線整合、行動端測試（Appium）、效能測試（k6）。同時為人像攝影師，攝影品牌 r.bing recording。

## 部落格文章

${articleLines}

## 分類主題

- 自動化測試：Appium、Playwright、pytest、Selenium 等框架實戰
- CI/CD：GitHub Actions、Jenkins 管線整合
- 測試策略：測試設計、Bug 管理、回歸測試、發布品質把關
- 職涯：QA 工程師技能成長、與 PM 協作、測試文化推動

## 聯絡與授權

網站：${SITE_URL}
RSS：${SITE_URL}/rss.xml
Sitemap：${SITE_URL}/sitemap.xml
文章可引用，請標明出處與連結。
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
