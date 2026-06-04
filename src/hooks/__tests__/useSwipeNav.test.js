import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))

import { useSwipeNav } from '../useSwipeNav'

function makeTouch(x, y) {
  return {
    touches: [{ clientX: x, clientY: y }],
    changedTouches: [{ clientX: x, clientY: y }],
  }
}

describe('useSwipeNav', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('returns a ref object', () => {
    const { result } = renderHook(() => useSwipeNav({ prevSlug: 'a', nextSlug: 'b' }))
    expect(result.current).toHaveProperty('current')
  })

  it('navigates to prevSlug on right swipe (deltaX > 80)', () => {
    const div = document.createElement('div')
    // Use a wrapper to set ref before the effect runs
    renderHook(() => {
      const swipeRef = useSwipeNav({ prevSlug: 'prev-post', nextSlug: 'next-post' })
      swipeRef.current = div
      return swipeRef
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(200, 100)))
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(310, 105)))
    })
    expect(mockNavigate).toHaveBeenCalledWith('/blog/prev-post')
  })

  it('navigates to nextSlug on left swipe (deltaX < -80)', () => {
    const div = document.createElement('div')
    renderHook(() => {
      const swipeRef = useSwipeNav({ prevSlug: 'prev-post', nextSlug: 'next-post' })
      swipeRef.current = div
      return swipeRef
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(300, 100)))
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(180, 105)))
    })
    expect(mockNavigate).toHaveBeenCalledWith('/blog/next-post')
  })

  it('does not navigate when vertical scroll detected (|deltaY| > 50)', () => {
    const div = document.createElement('div')
    renderHook(() => {
      const swipeRef = useSwipeNav({ prevSlug: 'a', nextSlug: 'b' })
      swipeRef.current = div
      return swipeRef
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(200, 100)))
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(310, 200)))
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not navigate right when prevSlug is null', () => {
    const div = document.createElement('div')
    renderHook(() => {
      const swipeRef = useSwipeNav({ prevSlug: null, nextSlug: 'next' })
      swipeRef.current = div
      return swipeRef
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(200, 100)))
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(310, 105)))
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not navigate left when nextSlug is null', () => {
    const div = document.createElement('div')
    renderHook(() => {
      const swipeRef = useSwipeNav({ prevSlug: 'prev', nextSlug: null })
      swipeRef.current = div
      return swipeRef
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), makeTouch(300, 100)))
    })
    act(() => {
      div.dispatchEvent(Object.assign(new Event('touchend'), makeTouch(180, 105)))
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
