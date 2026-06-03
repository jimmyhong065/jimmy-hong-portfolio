// functions/api/email-subscribe.js
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
  const { email } = await request.json()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400)
  }

  const headers = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }

  // Check if already confirmed
  const checkRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/email_subscribers?email=eq.${encodeURIComponent(email)}&select=confirmed`,
    { headers }
  )
  const existing = await checkRes.json()
  if (existing?.[0]?.confirmed) {
    return json({ status: 'already_confirmed' })
  }

  // Upsert (insert or update token if re-subscribing)
  const upsertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/email_subscribers`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify({ email }),
  })
  const [subscriber] = await upsertRes.json()

  const confirmUrl = `${env.SITE_URL}/api/email-confirm?token=${subscriber.token}`
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Jimmy Hong', email: env.BREVO_FROM },
      to: [{ email }],
      subject: '確認訂閱 Jimmy Hong 部落格',
      htmlContent: `
        <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;color:#222;">
          <p style="font-size:11px;color:#aaa;margin:0 0 24px;text-transform:uppercase;letter-spacing:.08em;">Jimmy Hong — QA Engineer</p>
          <h1 style="font-size:18px;font-weight:700;margin:0 0 12px;">確認您的訂閱</h1>
          <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 28px;">
            感謝訂閱！點擊下方按鈕確認後，有新文章發布時將會通知您。
          </p>
          <a href="${confirmUrl}"
            style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">
            確認訂閱
          </a>
          <p style="font-size:11px;color:#bbb;margin:32px 0 0;">若您未填寫此訂閱，請忽略此信。</p>
        </div>
      `,
    }),
  })

  return json({ status: 'confirmation_sent' })
}
