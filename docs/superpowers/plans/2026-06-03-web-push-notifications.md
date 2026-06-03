# Web Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Web Push notifications so blog subscribers receive a browser notification (title + excerpt) when a new article is published, with a manual send trigger from the admin panel.

**Architecture:** A Cloudflare Pages Function signs VAPID JWTs and encrypts payloads using the Web Crypto API (no npm packages) to send pushes to all stored subscriptions. Subscriptions are stored in Supabase. A bell icon in the Nav handles subscribe/unsubscribe; an admin section in AdminPostEdit triggers the send.

**Tech Stack:** Cloudflare Pages Functions (Web Crypto API), Supabase (service role key), React + Vitest

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `scripts/generate-vapid-keys.mjs` | One-time VAPID key generation script |
| Create | `public/sw.js` | Service Worker: show notification, handle click |
| Create | `functions/api/_push.js` | VAPID JWT signing + push payload encryption (Web Crypto) |
| Create | `functions/api/push-subscribe.js` | POST/DELETE subscription in Supabase |
| Create | `functions/api/push-send.js` | Auth-protected send push to all subscribers |
| Create | `src/hooks/usePushSubscription.js` | SW registration + subscribe/unsubscribe state logic |
| Create | `src/lib/push.test.js` | Unit tests for base64url helpers |
| Modify | `src/components/Nav.jsx` | Bell icon (desktop) |
| Modify | `src/pages/admin/AdminPostEdit.jsx` | Push notification send section |
| Modify | `.env` | Add `VITE_VAPID_PUBLIC_KEY` |

---

## Task 1: Generate VAPID Keys

**Files:**
- Create: `scripts/generate-vapid-keys.mjs`

- [ ] **Step 1: Create key generation script**

```js
// scripts/generate-vapid-keys.mjs
const keyPair = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
)
const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
const publicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey))
const publicB64 = btoa(String.fromCharCode(...publicRaw))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

console.log('VAPID_PUBLIC_KEY=' + publicB64)
console.log('VAPID_PRIVATE_KEY_JWK=' + JSON.stringify(privateJwk))
console.log('VAPID_SUBJECT=mailto:jimmyhong@seekrtech.com')
```

- [ ] **Step 2: Run the script and save output**

```bash
node scripts/generate-vapid-keys.mjs
```

Expected output (values will differ):
```
VAPID_PUBLIC_KEY=BN3...
VAPID_PRIVATE_KEY_JWK={"kty":"EC","crv":"P-256","x":"...","y":"...","d":"...","ext":true}
VAPID_SUBJECT=mailto:jimmyhong@seekrtech.com
```

Save these values — they are set as Cloudflare Pages env vars (step 4) and never regenerated.

- [ ] **Step 3: Create Supabase table**

Run in Supabase SQL Editor:

```sql
create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz default now()
);
```

- [ ] **Step 4: Add env vars**

Add to `.env` (frontend only needs public key):
```
VITE_VAPID_PUBLIC_KEY=<value from step 2>
```

Add to **Cloudflare Pages → Settings → Environment Variables** (all environments):
```
VAPID_PUBLIC_KEY=<value from step 2>
VAPID_PRIVATE_KEY_JWK=<value from step 2>
VAPID_SUBJECT=mailto:jimmyhong@seekrtech.com
SUPABASE_URL=https://sfzewfqqxvahnhjxstsw.supabase.co
SUPABASE_SERVICE_KEY=<service role key from Supabase dashboard → Project Settings → API>
PUSH_SECRET=<generate with: node -e "console.log(require('crypto').randomUUID())">
```

Also add `PUSH_SECRET` to `.env` for local dev:
```
VITE_PUSH_SECRET=<same value>
```

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-vapid-keys.mjs .env
git commit -m "feat(push): add VAPID key generation script and env setup"
```

---

## Task 2: Service Worker

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Write service worker**

```js
// public/sw.js
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  const { title = '新文章', body = '', slug = '' } = data
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/avatar.jpg',
      badge: '/favicon.svg',
      tag: slug,
      data: { slug },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const target = '/blog/' + event.notification.data.slug
      const existing = list.find(c => c.url.includes(target))
      if (existing) return existing.focus()
      return clients.openWindow(target)
    })
  )
})
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat(push): add service worker for push events"
```

---

## Task 3: Push Crypto Helper

**Files:**
- Create: `functions/api/_push.js`
- Create: `src/lib/push.test.js`

- [ ] **Step 1: Write test for base64url helpers (will fail)**

```js
// src/lib/push.test.js
import { describe, it, expect } from 'vitest'

// Copy these two helpers here for testing (they mirror _push.js)
function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
function base64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(s), c => c.charCodeAt(0))
}

describe('base64url helpers', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255])
    expect(base64urlDecode(base64urlEncode(bytes))).toEqual(bytes)
  })

  it('encodes with no padding chars', () => {
    const encoded = base64urlEncode(new Uint8Array([1, 2, 3]))
    expect(encoded).not.toContain('=')
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
  })
})
```

- [ ] **Step 2: Run tests to verify they compile and pass**

```bash
npm run test:run -- src/lib/push.test.js
```

Expected: 2 tests pass (helpers are inlined, no external dependency yet).

- [ ] **Step 3: Write `_push.js`**

```js
// functions/api/_push.js

export function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function base64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(s), c => c.charCodeAt(0))
}

function concat(...arrs) {
  const total = arrs.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(total)
  let i = 0
  for (const a of arrs) { out.set(a, i); i += a.length }
  return out
}

export async function buildVapidAuth(endpoint, privateKeyJwk, publicKeyB64, subject) {
  const url = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`

  const header = base64urlEncode(new TextEncoder().encode(
    JSON.stringify({ typ: 'JWT', alg: 'ES256' })
  ))
  const payload = base64urlEncode(new TextEncoder().encode(
    JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 43200, sub: subject })
  ))

  const key = await crypto.subtle.importKey(
    'jwk', privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(`${header}.${payload}`)
  )

  return `vapid t=${header}.${payload}.${base64urlEncode(sig)},k=${publicKeyB64}`
}

export async function encryptPushPayload(subscription, jsonPayload) {
  const uaPublic = base64urlDecode(subscription.p256dh)
  const authSecret = base64urlDecode(subscription.auth)

  const receiverKey = await crypto.subtle.importKey(
    'raw', uaPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, []
  )

  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, ['deriveBits']
  )
  const asPublic = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
  )

  const ikm = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverKey },
    serverKeyPair.privateKey, 256
  ))

  const salt = crypto.getRandomValues(new Uint8Array(16))

  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const prk = new Uint8Array(await crypto.subtle.deriveBits(
    {
      name: 'HKDF', hash: 'SHA-256',
      salt: authSecret,
      info: concat(new TextEncoder().encode('WebPush: info\0'), uaPublic, asPublic),
    },
    ikmKey, 256
  ))

  const prkKey = await crypto.subtle.importKey('raw', prk, 'HKDF', false, ['deriveBits'])

  const cek = new Uint8Array(await crypto.subtle.deriveBits(
    {
      name: 'HKDF', hash: 'SHA-256', salt,
      info: new TextEncoder().encode('Content-Encoding: aes128gcm\0'),
    },
    prkKey, 128
  ))

  const nonce = new Uint8Array(await crypto.subtle.deriveBits(
    {
      name: 'HKDF', hash: 'SHA-256', salt,
      info: new TextEncoder().encode('Content-Encoding: nonce\0'),
    },
    prkKey, 96
  ))

  const encKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    encKey,
    concat(new TextEncoder().encode(jsonPayload), new Uint8Array([2]))
  ))

  // aes128gcm record header: salt(16) + rs(4 BE) + idlen(1) + asPublic(65)
  const recordHeader = new Uint8Array(86)
  recordHeader.set(salt, 0)
  new DataView(recordHeader.buffer).setUint32(16, 4096, false)
  recordHeader[20] = 65
  recordHeader.set(asPublic, 21)

  return concat(recordHeader, ciphertext)
}
```

- [ ] **Step 4: Commit**

```bash
git add functions/api/_push.js src/lib/push.test.js
git commit -m "feat(push): add VAPID signing and payload encryption helper"
```

---

## Task 4: push-subscribe Pages Function

**Files:**
- Create: `functions/api/push-subscribe.js`

- [ ] **Step 1: Write the function**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/push-subscribe.js
git commit -m "feat(push): add push-subscribe Pages Function"
```

---

## Task 5: push-send Pages Function

**Files:**
- Create: `functions/api/push-send.js`

- [ ] **Step 1: Write the function**

```js
// functions/api/push-send.js
import { buildVapidAuth, encryptPushPayload } from './_push.js'

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

  const { title, excerpt, slug } = await request.json()
  if (!title || !slug) return json({ error: 'Missing title or slug' }, 400)

  // Fetch all subscriptions
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
  const payload = JSON.stringify({ title, body: (excerpt ?? '').slice(0, 120), slug })

  let sent = 0
  let removed = 0
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
      // network error for one subscription — continue others
    }
  }))

  // Clean up expired subscriptions
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
    removed = toRemove.length
  }

  return json({ sent, removed })
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/push-send.js
git commit -m "feat(push): add push-send Pages Function with VAPID signing"
```

---

## Task 6: usePushSubscription Hook

**Files:**
- Create: `src/hooks/usePushSubscription.js`

- [ ] **Step 1: Write the hook**

```js
// src/hooks/usePushSubscription.js
import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export function usePushSubscription() {
  // 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'
  const [state, setState] = useState('loading')
  const [swReg, setSwReg] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    navigator.serviceWorker.register('/sw.js').then(async reg => {
      setSwReg(reg)
      if (Notification.permission === 'denied') {
        setState('denied')
        return
      }
      const existing = await reg.pushManager.getSubscription()
      setState(existing ? 'subscribed' : 'unsubscribed')
    }).catch(() => setState('unsupported'))
  }, [])

  async function subscribe() {
    if (!swReg) return
    setError(null)
    try {
      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const j = sub.toJSON()
      const res = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }),
      })
      if (!res.ok) throw new Error('Server error')
      setState('subscribed')
    } catch (e) {
      if (Notification.permission === 'denied') {
        setState('denied')
      } else {
        setError(e.message === 'Server error' ? '訂閱失敗，請稍後再試' : 'iOS 需先將網站加入主畫面')
      }
    }
  }

  async function unsubscribe() {
    if (!swReg) return
    setError(null)
    try {
      const sub = await swReg.pushManager.getSubscription()
      if (!sub) { setState('unsubscribed'); return }
      await fetch('/api/push-subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
      setState('unsubscribed')
    } catch {
      setError('取消訂閱失敗')
    }
  }

  return { state, error, subscribe, unsubscribe }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePushSubscription.js
git commit -m "feat(push): add usePushSubscription hook"
```

---

## Task 7: Nav Bell Icon

**Files:**
- Modify: `src/components/Nav.jsx`

The bell is added to the desktop nav's right section (`hidden md:flex items-center gap-3`), next to the RSS icon.

- [ ] **Step 1: Add bell icon to Nav.jsx**

At the top of `Nav.jsx`, add the import:
```js
import { usePushSubscription } from '../hooks/usePushSubscription'
```

Inside `Nav()`, before the `return`:
```js
const { state, error, subscribe, unsubscribe } = usePushSubscription()
```

Replace the `<div className="hidden md:flex items-center gap-3">` section (lines 76–88) with:

```jsx
<div className="hidden md:flex items-center gap-3">
  <a href="/rss.xml" target="_blank" rel="noreferrer" title="RSS 訂閱"
    className="text-gray-400 hover:text-gray-700 transition-colors">
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
    </svg>
  </a>
  {(state === 'unsubscribed' || state === 'subscribed') && (
    <div className="relative">
      <button
        onClick={state === 'subscribed' ? unsubscribe : subscribe}
        title={state === 'subscribed' ? '取消通知訂閱' : '訂閱新文章通知'}
        className="text-gray-400 hover:text-gray-700 transition-colors"
      >
        {state === 'subscribed' ? (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        ) : (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        )}
      </button>
      {error && (
        <div className="absolute right-0 top-7 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  )}
  {settings.email && (
    <a href={`mailto:${settings.email}`} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700">
      聯絡我
    </a>
  )}
</div>
```

- [ ] **Step 2: Test manually**

```bash
npm run dev
```

1. Open `http://localhost:5173` in Chrome
2. Verify bell icon appears in desktop nav (≥768px viewport)
3. Click bell → browser asks for notification permission
4. Grant permission → bell changes to filled icon
5. Click again → bell returns to outline (unsubscribed)
6. Check Chrome DevTools → Application → Service Workers: `sw.js` registered

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.jsx
git commit -m "feat(push): add bell subscription icon to Nav"
```

---

## Task 8: Admin Send Button

**Files:**
- Modify: `src/pages/admin/AdminPostEdit.jsx`

- [ ] **Step 1: Add push send state and handler**

At the top of `AdminPostEdit.jsx`, add to existing imports:
```js
import { useState, useEffect, useRef, useCallback } from 'react'
```
(already imported — no change needed)

Inside `AdminPostEdit()`, after the existing `const [saving, setSaving] = useState(false)` lines, add:
```js
const [pushResult, setPushResult] = useState(null)  // null | { sent, removed } | 'sending' | 'error'
```

After `handleSubmit`, add:
```js
async function sendPushNotification() {
  setPushResult('sending')
  try {
    const res = await fetch('/api/push-send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_PUSH_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: form.title,
        excerpt: form.excerpt,
        slug: form.slug,
      }),
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    setPushResult(data)
  } catch {
    setPushResult('error')
  }
}
```

- [ ] **Step 2: Add send section to JSX**

Inside the `<form>` element, after the closing `</div>` of the publish checkbox section (after line 251 — the `</div>` that closes `flex flex-col gap-3`), and before the `<div className="flex gap-3 flex-wrap">` buttons section, add:

```jsx
{form.published && currentId && (
  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
    <p className="text-xs font-medium text-gray-500 mb-2">推播通知</p>
    <p className="text-xs text-gray-400 mb-1">標題：{form.title}</p>
    <p className="text-xs text-gray-400 mb-3">摘要：{(form.excerpt ?? '').slice(0, 80)}{form.excerpt?.length > 80 ? '…' : ''}</p>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={sendPushNotification}
        disabled={pushResult === 'sending'}
        className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded-md hover:bg-gray-700 disabled:opacity-50"
      >
        {pushResult === 'sending' ? '送出中…' : '送出通知給所有訂閱者'}
      </button>
      {pushResult && pushResult !== 'sending' && (
        <span className={`text-xs ${pushResult === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
          {pushResult === 'error'
            ? '送出失敗'
            : `已送出 ${pushResult.sent} 人${pushResult.removed > 0 ? `，清理 ${pushResult.removed} 個過期訂閱` : ''}`
          }
        </span>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Test manually**

1. In admin panel, open any published post
2. Scroll to bottom of form — verify the push notification section appears
3. Ensure bell icon in another tab shows subscribed state
4. Click "送出通知給所有訂閱者"
5. Verify result message shows "已送出 N 人"
6. Check browser notification arrives with correct title + excerpt
7. Click notification → confirm it opens the correct blog post URL
8. Open an unpublished post → verify the send section is NOT shown

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminPostEdit.jsx
git commit -m "feat(push): add push notification send section to admin post editor"
```

---

## Task 9: Deploy and Verify

- [ ] **Step 1: Verify all env vars are set in Cloudflare Pages**

In Cloudflare Pages dashboard → Settings → Environment variables, confirm:
- `VAPID_PUBLIC_KEY` ✓
- `VAPID_PRIVATE_KEY_JWK` ✓
- `VAPID_SUBJECT` ✓
- `SUPABASE_URL` ✓
- `SUPABASE_SERVICE_KEY` ✓
- `PUSH_SECRET` ✓

- [ ] **Step 2: Deploy**

```bash
git push origin main
```

Wait for Cloudflare Pages build to complete.

- [ ] **Step 3: End-to-end test on production**

1. Visit production URL → subscribe via bell icon
2. Check Supabase `push_subscriptions` table has a new row
3. In admin panel, open a published post → click "送出通知"
4. Confirm notification arrives on subscribed device within ~5 seconds
5. Click notification → opens correct blog post

- [ ] **Step 4: Test on Android Chrome**

Subscribe on Android Chrome, send from admin, verify notification appears in Android notification tray.
