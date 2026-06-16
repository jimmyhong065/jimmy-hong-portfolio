// Dynamic rendering：偵測 AI/搜尋爬蟲，對 /blog/:slug 注入文章全文 + meta + JSON-LD。
// 真人 / 非 bot 一律原樣放行，SPA 行為不變。
// 解決 SPA 對爬蟲是空殼的問題（Perplexity / GPTBot / Googlebot 才讀得到內容）。

const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
const SITE_URL = 'https://qa-lens.com'

// 已知會抓取/索引的 bot（含 AI 搜尋）。比對小寫 UA 子字串即可。
const BOT_UA = [
  'perplexitybot', 'gptbot', 'chatgpt-user', 'oai-searchbot',
  'claudebot', 'claude-web', 'anthropic-ai', 'ccbot',
  'googlebot', 'bingbot', 'google-extended', 'meta-externalfetcher',
  'applebot', 'duckduckbot', 'yandexbot', 'baiduspider',
]

function isBot(ua) {
  const s = ua.toLowerCase()
  return BOT_UA.some(b => s.includes(b))
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 極簡 markdown → 純文字（給爬蟲讀，不求排版精準）
function markdownToText(md = '') {
  return md
    .replace(/```[\s\S]*?```/g, ' ')        // code block
    .replace(/`([^`]+)`/g, '$1')             // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')   // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')  // links → 文字
    .replace(/^#{1,6}\s+/gm, '')             // headings 記號
    .replace(/[*_>#-]/g, ' ')                // 其餘 markdown 符號
    .replace(/\s+/g, ' ')
    .trim()
}

function buildDescription(post) {
  const raw = post.excerpt && post.excerpt.length > 10 ? post.excerpt : markdownToText(post.content)
  return escapeHtml(raw.slice(0, 160))
}

// 把文章內容注入 index.html 殼
function injectArticle(html, post) {
  const url = `${SITE_URL}/blog/${post.slug}`
  const title = escapeHtml(post.title)
  const desc = buildDescription(post)
  const bodyText = escapeHtml(markdownToText(post.content))
  const tags = Array.isArray(post.tags) ? post.tags : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    datePublished: post.published_at,
    keywords: tags.join(', '),
    author: { '@type': 'Person', name: 'Jimmy Hong' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }

  // 注入 <head>：覆蓋 title + 補 meta/JSON-LD（爬蟲讀最後一個 title）
  const headInject = `
  <title>${title}｜QA Lens</title>
  <meta name="description" content="${desc}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="article:published_time" content="${post.published_at}" />
  <link rel="canonical" href="${url}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
`

  // 注入可見全文進 #root（爬蟲讀 DOM 文字），真人不會看到這版（JS 接管會 re-render）
  const bodyInject = `<article>
  <h1>${title}</h1>
  ${tags.length ? `<p>${tags.map(t => `#${escapeHtml(t)}`).join(' ')}</p>` : ''}
  <div>${bodyText}</div>
</article>`

  let out = html.replace('</head>', `${headInject}</head>`)
  out = out.replace(/(<div id="root">)(<\/div>|)/, `$1${bodyInject}`)
  return out
}

async function fetchPost(slug) {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=slug,title,excerpt,content,tags,published_at&published=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { headers, signal: controller.signal },
    )
    clearTimeout(timer)
    const rows = await res.json()
    return Array.isArray(rows) && rows[0] ? rows[0] : null
  } catch {
    clearTimeout(timer)
    return null
  }
}

export async function onRequest(context) {
  const { request, next } = context
  const ua = request.headers.get('user-agent') || ''

  // 非 bot → 原樣 SPA，零影響
  if (!isBot(ua)) return next()

  const url = new URL(request.url)
  const m = url.pathname.match(/^\/blog\/([^/]+)\/?$/)
  // 只攔文章頁；其餘（首頁/列表/既有 functions）放行
  if (!m) return next()

  const post = await fetchPost(decodeURIComponent(m[1]))
  if (!post) return next()

  const res = await next()
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('text/html')) return res

  const html = await res.text()
  const injected = injectArticle(html, post)

  const headers = new Headers(res.headers)
  headers.set('Cache-Control', 'public, max-age=600')
  return new Response(injected, { status: 200, headers })
}
