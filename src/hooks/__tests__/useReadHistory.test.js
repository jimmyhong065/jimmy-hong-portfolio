import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useReadHistory } from '../useReadHistory'

describe('useReadHistory', () => {
  beforeEach(() => localStorage.clear())

  it('isRead returns false for unknown slug', () => {
    const { result } = renderHook(() => useReadHistory())
    expect(result.current.isRead('unknown')).toBe(false)
  })

  it('markRead makes isRead return true', () => {
    const { result } = renderHook(() => useReadHistory())
    act(() => result.current.markRead('my-post'))
    expect(result.current.isRead('my-post')).toBe(true)
  })

  it('markRead is idempotent (no duplicates in storage)', () => {
    const { result } = renderHook(() => useReadHistory())
    act(() => result.current.markRead('my-post'))
    act(() => result.current.markRead('my-post'))
    const stored = JSON.parse(localStorage.getItem('blog-read-history'))
    expect(stored.filter(s => s === 'my-post')).toHaveLength(1)
  })

  it('persists read history to localStorage', () => {
    const { result } = renderHook(() => useReadHistory())
    act(() => result.current.markRead('my-post'))
    expect(JSON.parse(localStorage.getItem('blog-read-history'))).toContain('my-post')
  })

  it('reads persisted history on init', () => {
    localStorage.setItem('blog-read-history', JSON.stringify(['old-post']))
    const { result } = renderHook(() => useReadHistory())
    expect(result.current.isRead('old-post')).toBe(true)
  })
})
