const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
const SITE_URL = 'https://jimmy-hong-portfolio.pages.dev'

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/blog', priority: '0.9', changefreq: 'daily' },
  { url: '/projects', priority: '0.8', changefreq: 'weekly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/photo', priority: '0.8', changefreq: 'weekly' },
]

export async function onRequest() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/posts?select=slug,published_at&published=eq.true&order=published_at.desc`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  )
  const posts = await res.json()

  const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const postUrls = posts.map(p => `
  <url>
    <loc>${SITE_URL}/blog/${p.slug}</loc>
    <lastmod>${p.published_at ? p.published_at.slice(0, 10) : ''}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${postUrls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
