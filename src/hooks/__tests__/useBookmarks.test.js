import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useBookmarks } from '../useBookmarks'

describe('useBookmarks', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to empty bookmarks', () => {
    const { result } = renderHook(() => useBookmarks())
    expect(result.current.bookmarks).toEqual([])
  })

  it('toggle adds a slug', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => result.current.toggle('my-post'))
    expect(result.current.bookmarks).toContain('my-post')
  })

  it('toggle removes a slug that was already added', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => result.current.toggle('my-post'))
    act(() => result.current.toggle('my-post'))
    expect(result.current.bookmarks).not.toContain('my-post')
  })

  it('isBookmarked returns true after adding', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => result.current.toggle('my-post'))
    expect(result.current.isBookmarked('my-post')).toBe(true)
  })

  it('isBookmarked returns false for unknown slug', () => {
    const { result } = renderHook(() => useBookmarks())
    expect(result.current.isBookmarked('unknown')).toBe(false)
  })

  it('persists bookmarks to localStorage', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => result.current.toggle('my-post'))
    expect(JSON.parse(localStorage.getItem('blog-bookmarks'))).toContain('my-post')
  })

  it('reads persisted bookmarks on init', () => {
    localStorage.setItem('blog-bookmarks', JSON.stringify(['saved-post']))
    const { result } = renderHook(() => useBookmarks())
    expect(result.current.isBookmarked('saved-post')).toBe(true)
  })
})
