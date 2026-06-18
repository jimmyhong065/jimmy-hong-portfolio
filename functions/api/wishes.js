// functions/api/wishes.js — public wishing wall. Returns featured wishes only.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestGet({ env }) {
  const headers = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  }
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/article_wishes?status=eq.featured&select=id,content,nickname,category,created_at&order=created_at.desc&limit=100`,
    { headers }
  )
  if (!res.ok) return json({ wishes: [] }, 200)
  const wishes = await res.json().catch(() => [])
  return json({ wishes: Array.isArray(wishes) ? wishes : [] })
}
