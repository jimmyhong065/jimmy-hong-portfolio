// scripts/generate-vapid-keys.mjs
// Run once: node scripts/generate-vapid-keys.mjs
// Copy output to Cloudflare Pages env vars. Never regenerate after first use.

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
