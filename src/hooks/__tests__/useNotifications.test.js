import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useNotifications } from '../useNotifications'

const MOCK_NOTIFS = [
  { id: 'aaa', title: '文章 A', body: '內容 A', url: '/blog/a', sent_at: '2026-06-01T00:00:00Z' },
  { id: 'bbb', title: '文章 B', body: '內容 B', url: '/blog/b', sent_at: '2026-06-02T00:00:00Z' },
]

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: MOCK_NOTIFS }),
      }),
    }),
  },
}))

describe('useNotifications', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns notifications from supabase', async () => {
    const { result } = renderHook(() => useNotifications())
    await act(async () => {})
    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.notifications[0].id).toBe('aaa')
  })

  it('unreadCount equals total when nothing in localStorage', async () => {
    const { result } = renderHook(() => useNotifications())
    await act(async () => {})
    expect(result.current.unreadCount).toBe(2)
  })

  it('unreadCount is 0 when all IDs in localStorage', async () => {
    localStorage.setItem('qa_read_notifs', JSON.stringify(['aaa', 'bbb']))
    const { result } = renderHook(() => useNotifications())
    await act(async () => {})
    expect(result.current.unreadCount).toBe(0)
  })

  it('markAllRead writes all IDs to localStorage and sets unreadCount to 0', async () => {
    const { result } = renderHook(() => useNotifications())
    await act(async () => {})
    expect(result.current.unreadCount).toBe(2)
    act(() => result.current.markAllRead())
    expect(result.current.unreadCount).toBe(0)
    const stored = JSON.parse(localStorage.getItem('qa_read_notifs') ?? '[]')
    expect(stored).toContain('aaa')
    expect(stored).toContain('bbb')
  })

  it('loading starts true and becomes false after fetch', async () => {
    const { result } = renderHook(() => useNotifications())
    expect(result.current.loading).toBe(true)
    await act(async () => {})
    expect(result.current.loading).toBe(false)
  })
})
