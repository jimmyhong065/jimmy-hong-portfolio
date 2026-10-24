import { Buffer } from 'node:buffer'
import { afterEach, expect, it, vi } from 'vitest'
import { requireAdmin } from '../_auth'

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
  ADMIN_EMAIL: 'admin@example.com',
}

function token(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `eyJhbGciOiJIUzI1NiJ9.${encoded}.signature`
}

function request(accessToken) {
  return new Request('https://qa-lens.com/api/admin/subscribers', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('returns 401 without a token', async () => {
  expect((await requireAdmin(request(), env)).status).toBe(401)
})

it('returns 401 when Supabase rejects the token', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  expect((await requireAdmin(request(token({ aal: 'aal2' })), env)).status).toBe(401)
})

it('returns 403 for a non-admin aal2 user', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ email: 'other@example.com' })))
  expect((await requireAdmin(request(token({ aal: 'aal2' })), env)).status).toBe(403)
})

it('returns MFA_REQUIRED for an admin aal1 token', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ email: 'admin@example.com' })))
  const response = await requireAdmin(request(token({ aal: 'aal1' })), env)
  expect(response.status).toBe(403)
  await expect(response.json()).resolves.toEqual({ error: 'MFA required', code: 'MFA_REQUIRED' })
})

it('allows an admin aal2 token', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ email: 'admin@example.com' })))
  await expect(requireAdmin(request(token({ aal: 'aal2' })), env)).resolves.toBeNull()
})

it('rejects malformed tokens even if mocked Supabase accepts them', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ email: 'admin@example.com' })))
  expect((await requireAdmin(request('not-a-jwt'), env)).status).toBe(401)
})
