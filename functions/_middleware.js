// Dynamic rendering：偵測 AI/搜尋爬蟲，對 /blog/:slug 注入文章全文 + meta + JSON-LD。
// 真人 / 非 bot 一律原樣放行，SPA 行為不變。
// 解決 SPA 對爬蟲是空殼的問題（Perplexity / GPTBot / Googlebot 才讀得到內容）。

import { fetchPublishedCourses, courseSlugMap, postPath } from './_courses.js'

const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
const SITE_URL = 'https://qa-lens.com'
const ALT_HOSTS = ['jimmy-hong-portfolio.pages.dev', 'www.qa-lens.com']

// 已知會抓取/索引的 bot（含 AI 搜尋）。比對小寫 UA 子字串即可。
const BOT_UA = [
  'perplexitybot', 'gptbot', 'chatgpt-user', 'oai-searchbot',
  'claudebot', 'claude-web', 'anthropic-ai', 'ccbot',
  'googlebot', 'bingbot', 'google-extended', 'meta-externalfetcher',
  'applebot', 'duckduckbot', 'yandexbot', 'baiduspider',
]

// 改過 slug 的文章：舊網址 301 到新網址（真人與 bot 都轉）
const SLUG_REDIRECTS = {
  '2026-05-16-draft': 'closed-bug-ticket-real-bug-report',
}

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
    .replace(/<[^>]+>/g, ' ')                // 後台編輯過的文章是 HTML
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
function injectArticle(html, post, path = `/blog/${post.slug}`) {
  const url = `${SITE_URL}${path}`
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

// --- 通用注入 helper ---
function injectHead(html, headHtml) {
  return html.replace('</head>', `${headHtml}</head>`)
}
function injectBody(html, bodyHtml) {
  return html.replace(/(<div id="root">)(<\/div>|)/, `$1${bodyHtml}`)
}
function metaHead({ title, desc, url, type = 'website' }) {
  const t = escapeHtml(title)
  const d = escapeHtml(desc)
  return `
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${url}" />
  <link rel="canonical" href="${url}" />
`
}

// 首頁 meta + 簡介
function injectHome(html) {
  const title = 'QA Lens — Jimmy Hong 的 QA 工程部落格'
  const desc = 'QA Lens 是 Jimmy Hong 的測試工程部落格，分享軟體測試、QA 自動化、AI 輔助測試、測試策略與職涯經驗。'
  let out = injectHead(html, metaHead({ title, desc, url: `${SITE_URL}/` }))
  out = injectBody(out, `<section>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(desc)}</p>
</section>`)
  return out
}

// 列表頁 meta + 文章連結清單（幫爬蟲發現所有文章）
function injectBlogList(html, posts, courses = []) {
  const title = '文章列表｜QA Lens'
  const desc = 'QA Lens 全部文章：軟體測試、QA 自動化、AI 測試、測試策略與職涯主題。'
  let out = injectHead(html, metaHead({ title, desc, url: `${SITE_URL}/blog` }))
  const slugById = courseSlugMap(courses)
  const items = (Array.isArray(posts) ? posts : []).map(p => {
    const u = `${SITE_URL}${postPath(p, slugById)}`
    return `  <li><a href="${u}">${escapeHtml(p.title)}</a>${p.excerpt ? ` — ${escapeHtml(p.excerpt.slice(0, 120))}` : ''}</li>`
  }).join('\n')
  out = injectBody(out, `<section>
  <h1>文章列表</h1>
  <ul>
${items}
  </ul>
</section>`)
  return out
}

async function fetchPostList() {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=slug,course_id,title,excerpt&published=eq.true&order=published_at.desc`,
      { headers, signal: controller.signal },
    )
    clearTimeout(timer)
    const rows = await res.json()
    return Array.isArray(rows) ? rows : []
  } catch {
    clearTimeout(timer)
    return []
  }
}

async function fetchPost(slug) {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=slug,course_id,title,excerpt,content,tags,published_at&published=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`,
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

// 系列首頁 meta + 章節連結清單
function injectCourse(html, course, chapters) {
  const url = `${SITE_URL}/course/${course.slug}`
  const desc = course.description || course.subtitle || course.title
  let out = injectHead(html, metaHead({ title: `${course.title}｜QA Lens`, desc: desc.slice(0, 160), url }))
  const items = chapters.map(c =>
    `  <li><a href="${url}/${c.slug}">${escapeHtml(c.title)}</a>${c.excerpt ? ` — ${escapeHtml(c.excerpt.slice(0, 120))}` : ''}</li>`,
  ).join('\n')
  out = injectBody(out, `<section>
  <h1>${escapeHtml(course.title)}</h1>
  ${course.description ? `<p>${escapeHtml(course.description)}</p>` : ''}
  <ol>
${items}
  </ol>
</section>`)
  return out
}

async function fetchJson(path) {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers, signal: controller.signal })
    clearTimeout(timer)
    const rows = await res.json()
    return Array.isArray(rows) ? rows : []
  } catch {
    clearTimeout(timer)
    return []
  }
}

async function fetchCourse(slug) {
  const [course] = await fetchJson(`courses?select=id,slug,title,subtitle,description&published=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`)
  return course ?? null
}

async function fetchChapters(courseId) {
  return fetchJson(`posts?select=slug,title,excerpt&published=eq.true&course_id=eq.${courseId}&order=course_order`)
}

// 給爬蟲的真 404：狀態碼 404 + noindex，並留一條回文章列表的路讓爬蟲繼續走。
function notFoundResponse() {
  const body = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<meta name="robots" content="noindex" />
<title>找不到頁面｜QA Lens</title>
</head>
<body>
<h1>找不到這篇文章</h1>
<p>這個網址的文章已經下架或不存在。</p>
<p><a href="${SITE_URL}/blog">回文章列表</a></p>
</body>
</html>`
  return new Response(body, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)

  // 非正式網域 301 到 qa-lens.com，避免重複內容。
  // 只轉 production 的 pages.dev 與 www；<hash>.pages.dev preview 照常可用。
  // 只轉 GET/HEAD，301 會把 POST 變 GET，API 呼叫會壞。
  if (ALT_HOSTS.includes(url.hostname) && (request.method === 'GET' || request.method === 'HEAD')) {
    return Response.redirect(`${SITE_URL}${url.pathname}${url.search}`, 301)
  }

  const path = url.pathname.replace(/\/$/, '') || '/'

  if (path.startsWith('/assets/')) {
    const res = await next()
    const ct = res.headers.get('content-type') || ''
    if (res.status === 200 && ct.includes('text/html')) {
      return new Response('Asset not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
    return res
  }

  const moved = path.match(/^\/blog\/([^/]+)$/)
  const target = moved && SLUG_REDIRECTS[decodeURIComponent(moved[1])]
  if (target) return Response.redirect(`${SITE_URL}/blog/${target}`, 301)

  const ua = request.headers.get('user-agent') || ''

  // 非 bot → 原樣 SPA，零影響
  if (!isBot(ua)) return next()

  // 決定注入器：文章頁 / 首頁 / 列表頁，其餘（既有 functions 等）放行
  let inject = null
  const m = path.match(/^\/blog\/([^/]+)$/)
  if (m) {
    const post = await fetchPost(decodeURIComponent(m[1]))
    // 文章不存在／已下架：回真正的 404，不要用 200 回空殼。
    // 舊做法 return next() 會讓已刪除的文章變成 soft 404（200 + 「找不到此文章」），
    // Google 會持續抓取並歸類成「未建立索引」，拖累整站索引狀況。
    if (!post) return notFoundResponse()
    // 已發布系列的章節：正式網址在 /course/ 底下
    if (post.course_id) {
      const target = postPath(post, courseSlugMap(await fetchPublishedCourses()))
      if (target !== path) return Response.redirect(`${SITE_URL}${target}`, 301)
    }
    inject = html => injectArticle(html, post)
  } else if (path.startsWith('/course/')) {
    const [, , courseSlug, chapterSlug, extra] = path.split('/').map(decodeURIComponent)
    if (extra !== undefined) return next()
    const course = await fetchCourse(courseSlug)
    if (!course) return notFoundResponse()
    if (chapterSlug) {
      const post = await fetchPost(chapterSlug)
      if (!post || post.course_id !== course.id) return notFoundResponse()
      inject = html => injectArticle(html, post, path)
    } else {
      const chapters = await fetchChapters(course.id)
      inject = html => injectCourse(html, course, chapters)
    }
  } else if (path === '/') {
    inject = injectHome
  } else if (path === '/blog') {
    const [posts, courses] = await Promise.all([fetchPostList(), fetchPublishedCourses()])
    inject = html => injectBlogList(html, posts, courses)
  } else {
    return next()
  }

  const res = await next()
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('text/html')) return res

  const html = await res.text()
  const injected = inject(html)

  const headers = new Headers(res.headers)
  headers.set('Cache-Control', 'public, max-age=600')
  return new Response(injected, { status: 200, headers })
}
