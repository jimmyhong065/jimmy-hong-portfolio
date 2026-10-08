import { vi } from 'vitest'
import { requireAdmin } from '../../functions/api/_auth.js'

const env = {
  SUPABASE_URL: 'https://sb.example.com',
  SUPABASE_SERVICE_KEY: 'service-key',
  ADMIN_EMAIL: 'admin@example.com',
}

function req(headers = {}) {
  return new Request('https://qa-lens.com/api/x', { headers })
}

describe('requireAdmin', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('rejects missing Authorization header with 401 without calling Supabase', async () => {
    const res = await requireAdmin(req(), env)
    expect(res.status).toBe(401)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('rejects non-Bearer header with 401', async () => {
    const res = await requireAdmin(req({ Authorization: 'Basic abc' }), env)
    expect(res.status).toBe(401)
  })

  it('rejects invalid token with 401', async () => {
    global.fetch.mockResolvedValue({ ok: false })
    const res = await requireAdmin(req({ Authorization: 'Bearer bad' }), env)
    expect(res.status).toBe(401)
  })

  it('rejects valid non-admin user with 403', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ email: 'evil@example.com' }) })
    const res = await requireAdmin(req({ Authorization: 'Bearer tok' }), env)
    expect(res.status).toBe(403)
  })

  it('rejects when ADMIN_EMAIL is not configured', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ email: undefined }) })
    const res = await requireAdmin(req({ Authorization: 'Bearer tok' }), { ...env, ADMIN_EMAIL: undefined })
    expect(res.status).toBe(403)
  })

  it('returns null for admin and verifies token against Supabase', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ email: 'Admin@Example.com' }) })
    const res = await requireAdmin(req({ Authorization: 'Bearer tok' }), env)
    expect(res).toBeNull()
    expect(global.fetch).toHaveBeenCalledWith('https://sb.example.com/auth/v1/user', {
      headers: { apikey: 'service-key', Authorization: 'Bearer tok' },
    })
  })
})

