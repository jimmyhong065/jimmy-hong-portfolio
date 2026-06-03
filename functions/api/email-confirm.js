// functions/api/email-confirm.js
function html(title, message) {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title} - Jimmy Hong</title></head>
    <body style="font-family:-apple-system,sans-serif;max-width:480px;margin:80px auto;padding:32px;text-align:center;color:#222;">
      <p style="font-size:11px;color:#aaa;margin:0 0 24px;text-transform:uppercase;letter-spacing:.08em;">Jimmy Hong</p>
      <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
      <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 28px;">${message}</p>
      <a href="/blog" style="font-size:13px;color:#111;">← 回部落格</a>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html;charset=utf-8' } }
  )
}

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return html('連結無效', '此確認連結無效，請重新訂閱。')

  const headers = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/email_subscribers?token=eq.${token}&select=id,confirmed`,
    { headers }
  )
  const [subscriber] = await res.json()
  if (!subscriber) return html('連結無效', '此確認連結已失效或不存在，請重新訂閱。')
  if (subscriber.confirmed) return html('已訂閱', '您已完成訂閱，有新文章時會收到通知。')

  await fetch(
    `${env.SUPABASE_URL}/rest/v1/email_subscribers?id=eq.${subscriber.id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ confirmed: true }),
    }
  )

  return html('訂閱成功！', '感謝訂閱 Jimmy Hong 部落格，有新文章時將會通知您。')
}
