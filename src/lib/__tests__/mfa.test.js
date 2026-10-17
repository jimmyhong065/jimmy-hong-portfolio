import { describe, expect, it, vi } from 'vitest'
import {
  REQUIRED_TOTP_FACTORS,
  loadMfaState,
  mfaDestination,
  safeAdminReturnTo,
} from '../mfa'

describe('safeAdminReturnTo', () => {
  it.each(['/admin', '/admin/posts', '/admin/settings?tab=security'])(
    'accepts an internal admin path: %s',
    path => expect(safeAdminReturnTo(path)).toBe(path),
  )

  it.each(['https://evil.example', '//evil.example', '/', '/login', null])(
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
      currentLevel: 'aal1', nextLevel: 'aal2', verifiedFactors: [{ id: 'one' }],
    })
  })
})
