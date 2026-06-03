// functions/api/push-subscribe.js

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

async function supabaseRequest(env, method, path, body) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestPost({ request, env }) {
  const { endpoint, keys } = await request.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return json({ error: 'Missing fields' }, 400)
  }
  await supabaseRequest(env, 'POST', 'push_subscriptions', {
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  })
  return json({ ok: true })
}

export async function onRequestDelete({ request, env }) {
  const { endpoint } = await request.json()
  if (!endpoint) return json({ error: 'Missing endpoint' }, 400)
  await supabaseRequest(env, 'DELETE', `push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, null)
  return json({ ok: true })
}
