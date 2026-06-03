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
