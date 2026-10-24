import { describe, expect, it, vi } from 'vitest'

vi.mock('../supabase', () => ({ supabase: {} }))

import {
  REQUIRED_TOTP_FACTORS,
  loadMfaState,
  mfaDestination,
  safeAdminReturnTo,
} from '../mfa'

describe('safeAdminReturnTo', () => {
  it('falls back to admin when URL parsing fails', () => {
    expect(safeAdminReturnTo('/\\[')).toBe('/admin')
  })

  it('rejects non-admin input that normalizes into an admin path', () => {
    expect(safeAdminReturnTo('/login/../admin/posts')).toBe('/admin')
  })

  it.each([
    '/admin',
    '/admin/posts',
    '/admin/settings?tab=security',
    '/admin/posts?tab=security#totp',
  ])(
    'accepts an internal admin path: %s',
    path => expect(safeAdminReturnTo(path)).toBe(path),
  )

  it.each([
    'https://evil.example',
    '//evil.example',
    '/',
    '/login',
    '/administrator',
    '/admin/../login',
    null,
  ])(
    'rejects an unsafe return path: %s',
    path => expect(safeAdminReturnTo(path)).toBe('/admin'),
  )
})

describe('mfaDestination', () => {
  const session = { user: { id: 'admin' } }

  it('requires login without a session', () => {
    expect(mfaDestination({ session: null })).toBe('/login')
  })

  it('starts setup when no verified factor exists', () => {
    expect(mfaDestination({ session, currentLevel: 'aal1', verifiedFactors: [] }))
      .toBe('/mfa/setup?returnTo=%2Fadmin')
  })

  it('verifies an existing factor before enrolling a second one', () => {
    expect(mfaDestination({
      session,
      currentLevel: 'aal1',
      verifiedFactors: [{ id: 'one' }],
      returnTo: '/admin/posts',
    })).toBe('/mfa/verify?returnTo=%2Fadmin%2Fposts')
  })

  it('requires a second factor after reaching aal2', () => {
    expect(mfaDestination({
      session,
      currentLevel: 'aal2',
      verifiedFactors: [{ id: 'one' }],
    })).toBe('/mfa/setup?returnTo=%2Fadmin')
  })

  it('returns to admin only at aal2 with two factors', () => {
    expect(REQUIRED_TOTP_FACTORS).toBe(2)
    expect(mfaDestination({
      session,
      currentLevel: 'aal2',
      verifiedFactors: [{ id: 'one' }, { id: 'two' }],
      returnTo: '/admin/settings',
    })).toBe('/admin/settings')
  })

  it('verifies before granting aal2 even when two factors are already verified', () => {
    expect(mfaDestination({
      session,
      currentLevel: 'aal1',
      verifiedFactors: [{ id: 'one' }, { id: 'two' }],
    })).toBe('/mfa/verify?returnTo=%2Fadmin')
  })
})

describe('loadMfaState', () => {
  it('loads session, AAL, and verified TOTP factors', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'admin' } } }, error: null }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({ data: { totp: [{ id: 'one' }], all: [] }, error: null }),
          getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
            data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null,
          }),
        },
      },
    }

    await expect(loadMfaState(client)).resolves.toMatchObject({
      session: { user: { id: 'admin' } },
      currentLevel: 'aal1', nextLevel: 'aal2', verifiedFactors: [{ id: 'one' }],
    })
  })

  it('does not load factors or AAL when there is no session', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        mfa: {
          listFactors: vi.fn(),
          getAuthenticatorAssuranceLevel: vi.fn(),
        },
      },
    }

    await expect(loadMfaState(client)).resolves.toEqual({
      session: null, currentLevel: null, nextLevel: null, verifiedFactors: [],
    })
    expect(client.auth.mfa.listFactors).not.toHaveBeenCalled()
    expect(client.auth.mfa.getAuthenticatorAssuranceLevel).not.toHaveBeenCalled()
  })

  it('throws a getSession error', async () => {
    const error = new Error('session failed')
    const client = { auth: { getSession: vi.fn().mockResolvedValue({ data: null, error }) } }

    await expect(loadMfaState(client)).rejects.toBe(error)
  })

  it('throws a listFactors error', async () => {
    const error = new Error('factors failed')
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'admin' } } }, error: null }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({ data: null, error }),
          getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
            data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null,
          }),
        },
      },
    }

    await expect(loadMfaState(client)).rejects.toBe(error)
  })

  it('throws an AAL error', async () => {
    const error = new Error('AAL failed')
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'admin' } } }, error: null }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({ data: { totp: [] }, error: null }),
          getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({ data: null, error }),
        },
      },
    }

    await expect(loadMfaState(client)).rejects.toBe(error)
  })
})
