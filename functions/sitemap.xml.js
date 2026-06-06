const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
const SITE_URL = 'https://jimmy-hong-portfolio.pages.dev'

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/blog', priority: '0.9', changefreq: 'daily' },
  { url: '/projects', priority: '0.8', changefreq: 'weekly' },
  { url: '/services', priority: '0.7', changefreq: 'monthly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/photo', priority: '0.8', changefreq: 'weekly' },
]

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
}

function buildXml(posts) {
  const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const postUrls = Array.isArray(posts) ? posts.map(p => `
  <url>
    <loc>${SITE_URL}/blog/${p.slug}</loc>
    <lastmod>${p.published_at ? p.published_at.slice(0, 10) : ''}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('') : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${postUrls}
</urlset>`
}

export async function onRequest() {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const postsRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=slug,published_at&published=eq.true&order=published_at.desc`, { headers, signal: controller.signal })
    clearTimeout(timer)
    const posts = await postsRes.json()
    return new Response(buildXml(posts), { headers: XML_HEADERS })
  } catch {
    clearTimeout(timer)
    return new Response(buildXml([]), { headers: XML_HEADERS })
  }
}
