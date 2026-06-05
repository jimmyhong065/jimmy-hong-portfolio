// functions/api/push-send.js
import { buildVapidAuth, encryptPushPayload } from './_push.js'
import { stripMarkdown } from './_utils.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') ?? ''
  if (auth !== `Bearer ${env.PUSH_SECRET}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { title, excerpt = '', slug } = await request.json()
  if (!title || !slug) return json({ error: 'Missing title or slug' }, 400)

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/push_subscriptions?select=id,endpoint,p256dh,auth`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
  })
  const subscriptions = await res.json()
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return json({ sent: 0, removed: 0 })
  }

  const privateKeyJwk = JSON.parse(env.VAPID_PRIVATE_KEY_JWK)
  const notificationBody = stripMarkdown(excerpt).slice(0, 120)
  const payload = JSON.stringify({ title, body: notificationBody, slug })

  let sent = 0
  const toRemove = []

  await Promise.allSettled(subscriptions.map(async sub => {
    try {
      const vapidAuth = await buildVapidAuth(sub.endpoint, privateKeyJwk, env.VAPID_PUBLIC_KEY, env.VAPID_SUBJECT)
      const body = await encryptPushPayload(sub, payload)

      const pushRes = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': vapidAuth,
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'TTL': '86400',
        },
        body,
      })

      if (pushRes.status === 201 || pushRes.status === 200) {
        sent++
      } else if (pushRes.status === 410 || pushRes.status === 404) {
        toRemove.push(sub.id)
      }
    } catch {
      // network error — continue
    }
  }))

  if (toRemove.length > 0) {
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/push_subscriptions?id=in.(${toRemove.join(',')})`,
      {
        method: 'DELETE',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    )
  }

  if (sent > 0) {
    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        title,
        body: notificationBody,
        url: `${env.SITE_URL}/blog/${slug}`,
      }),
    })
    if (!insertRes.ok) {
      console.error('notifications INSERT failed', insertRes.status, await insertRes.text())
    }
  }

  return json({ sent, removed: toRemove.length })
}
