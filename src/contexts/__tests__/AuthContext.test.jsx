// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../AuthContext'
import { useAuth } from '../../hooks/useAuth'
import { loadMfaState } from '../../lib/mfa'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/mfa', () => ({ loadMfaState: vi.fn() }))
vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange: vi.fn(), signOut: vi.fn() } },
}))

const authState = {
  session: { user: { id: 'admin' } },
  currentLevel: 'aal2',
  nextLevel: 'aal2',
  verifiedFactors: [{ id: 'one' }, { id: 'two' }],
}
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
let onAuthStateChange
let unsubscribe

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    loadMfaState.mockResolvedValue(authState)
    unsubscribe = vi.fn()
    supabase.auth.onAuthStateChange.mockImplementation(callback => {
      onAuthStateChange = callback
      return { data: { subscription: { unsubscribe } } }
    })
    supabase.auth.signOut.mockResolvedValue({ error: null })
  })

  it('exposes one loaded MFA state to consumers', async () => {
    const { result } = renderHook(() => [useAuth(), useAuth()], { wrapper })
    await waitFor(() => expect(result.current[0].authReady).toBe(true))
    expect(result.current[0].currentLevel).toBe('aal2')
    expect(result.current[0].verifiedFactors).toHaveLength(2)
    expect(result.current[0].refreshAuth).toEqual(expect.any(Function))
    expect(result.current[0]).toBe(result.current[1])
    expect(loadMfaState).toHaveBeenCalledTimes(1)
  })

  it('clears local auth state after successful sign out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.authReady).toBe(true))
    await act(async () => { await result.current.signOut() })
    expect(result.current).toMatchObject({
      session: null, currentLevel: null, nextLevel: null,
      verifiedFactors: [], authReady: true, loading: false,
    })
  })

  it('preserves auth state when sign out fails', async () => {
    const error = new Error('Sign out failed')
    supabase.auth.signOut.mockResolvedValue({ error })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.authReady).toBe(true))
    await act(async () => {
      expect(await result.current.signOut()).toEqual({ error })
    })
    expect(result.current.session).toEqual(authState.session)
  })

  it('exposes refresh errors and finishes loading, then recovers', async () => {
    const error = new Error('MFA unavailable')
    loadMfaState.mockRejectedValueOnce(error)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.authReady).toBe(true))
    expect(result.current.authError).toBe(error)
    expect(result.current.loading).toBe(false)
    await act(async () => { await result.current.refreshAuth() })
    expect(result.current.authError).toBeNull()
    expect(result.current.session).toEqual(authState.session)
  })

  it('returns refresh failures to the caller without leaving loading active', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.authReady).toBe(true))
    const error = new Error('Refresh failed')
    loadMfaState.mockRejectedValueOnce(error)
    act(() => onAuthStateChange('TOKEN_REFRESHED', authState.session))
    await waitFor(() => expect(result.current.authError).toBe(error))
    expect(result.current.authReady).toBe(true)
    expect(result.current.loading).toBe(false)
    loadMfaState.mockRejectedValueOnce(error)
    await act(async () => { await expect(result.current.refreshAuth()).rejects.toBe(error) })
  })

  it('unsubscribes and cancels queued refresh on unmount', async () => {
    const { result, unmount } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.authReady).toBe(true))
    act(() => onAuthStateChange('TOKEN_REFRESHED', authState.session))
    act(() => onAuthStateChange('TOKEN_REFRESHED', authState.session))
    unmount()
    await new Promise(resolve => window.setTimeout(resolve, 10))
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(loadMfaState).toHaveBeenCalledTimes(1)
  })

  it('does not restore a signed-out session from an older refresh', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.authReady).toBe(true))
    let resolveRefresh
    loadMfaState.mockImplementationOnce(() => new Promise(resolve => { resolveRefresh = resolve }))
    let pending
    act(() => { pending = result.current.refreshAuth() })
    await act(async () => { await result.current.signOut() })
    await act(async () => { resolveRefresh(authState); await pending })
    expect(result.current.session).toBeNull()
    expect(result.current.verifiedFactors).toEqual([])
  })

  it('keeps the newest refresh when requests finish out of order', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.authReady).toBe(true))
    let resolveOlder
    loadMfaState.mockImplementationOnce(() => new Promise(resolve => { resolveOlder = resolve }))
    let older
    act(() => { older = result.current.refreshAuth() })
    const newerState = { ...authState, currentLevel: 'aal1', verifiedFactors: [] }
    loadMfaState.mockResolvedValueOnce(newerState)
    await act(async () => { await result.current.refreshAuth() })
    await act(async () => { resolveOlder(authState); await older })
    expect(result.current.currentLevel).toBe('aal1')
    expect(result.current.verifiedFactors).toEqual([])
  })
})
