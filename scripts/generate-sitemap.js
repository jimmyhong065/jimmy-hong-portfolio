import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync } from 'fs'

// Load .env.local for local development
const env = {}
try {
  readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) env[k.trim()] = v.join('=').trim()
  })
} catch {}

const SITE_URL = 'https://jimmy-hong-portfolio.pages.dev'
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY

const staticRoutes = [
  { path: '/',         changefreq: 'daily',   priority: '1.0' },
  { path: '/blog',     changefreq: 'daily',   priority: '0.9' },
  { path: '/projects', changefreq: 'weekly',  priority: '0.9' },
  { path: '/photo',    changefreq: 'weekly',  priority: '0.8' },
  { path: '/about',    changefreq: 'monthly', priority: '0.7' },
  { path: '/services', changefreq: 'monthly', priority: '0.7' },
  { path: '/faq',      changefreq: 'monthly', priority: '0.6' },
]

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n')
}

async function generate() {
  const staticEntries = staticRoutes.map(r => urlEntry({ loc: `${SITE_URL}${r.path}`, ...r }))

  let dynamicEntries = []
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const [{ data: posts, error: e1 }, { data: projects, error: e2 }] = await Promise.all([
      supabase.from('posts').select('slug, published_at, created_at').eq('published', true),
      supabase.from('projects').select('id, created_at'),
    ])
    if (e1) console.warn('posts fetch failed:', e1.message)
    if (e2) console.warn('projects fetch failed:', e2.message)

    dynamicEntries = [
      ...(posts ?? []).map(p => urlEntry({
        loc: `${SITE_URL}/blog/${p.slug}`,
        lastmod: p.published_at ?? p.created_at,
        changefreq: 'weekly',
        priority: '0.8',
      })),
      ...(projects ?? []).map(p => urlEntry({
        loc: `${SITE_URL}/projects/${p.id}`,
        lastmod: p.created_at,
        changefreq: 'monthly',
        priority: '0.7',
      })),
    ]
  } else {
    console.warn('No Supabase credentials — generating static-only sitemap')
  }

  const entries = [...staticEntries, ...dynamicEntries]
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n')

  writeFileSync('public/sitemap.xml', xml)
  console.log(`sitemap.xml generated — ${entries.length} URLs`)
}

generate().catch(e => { console.error(e); process.exit(1) })
