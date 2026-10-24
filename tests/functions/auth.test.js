import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAdmin } from '../../functions/api/_auth.js'

const env = {
  SUPABASE_URL: 'https://sb.example.com',
  SUPABASE_SERVICE_KEY: 'service-key',
  ADMIN_EMAIL: 'admin@example.com',
}

function req(headers = {}) {
  return new Request('https://qa-lens.com/api/x', { headers })
}

const adminToken = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ aal: 'aal2' })).toString('base64url')}.signature`

describe('requireAdmin', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('rejects missing Authorization header with 401 without calling Supabase', async () => {
    const res = await requireAdmin(req(), env)
    expect(res.status).toBe(401)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('rejects non-Bearer header with 401', async () => {
    const res = await requireAdmin(req({ Authorization: 'Basic abc' }), env)
    expect(res.status).toBe(401)
  })

  it('rejects invalid token with 401', async () => {
    globalThis.fetch.mockResolvedValue({ ok: false })
    const res = await requireAdmin(req({ Authorization: 'Bearer bad' }), env)
    expect(res.status).toBe(401)
  })

  it('rejects valid non-admin user with 403', async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ email: 'evil@example.com' }) })
    const res = await requireAdmin(req({ Authorization: `Bearer ${adminToken}` }), env)
    expect(res.status).toBe(403)
  })

  it('rejects when ADMIN_EMAIL is not configured', async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ email: undefined }) })
    const res = await requireAdmin(req({ Authorization: `Bearer ${adminToken}` }), { ...env, ADMIN_EMAIL: undefined })
    expect(res.status).toBe(403)
  })

  it('returns null for admin and verifies token against Supabase', async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ email: 'Admin@Example.com' }) })
    const res = await requireAdmin(req({ Authorization: `Bearer ${adminToken}` }), env)
    expect(res).toBeNull()
    expect(globalThis.fetch).toHaveBeenCalledWith('https://sb.example.com/auth/v1/user', {
      headers: { apikey: 'service-key', Authorization: `Bearer ${adminToken}` },
    })
  })
})

