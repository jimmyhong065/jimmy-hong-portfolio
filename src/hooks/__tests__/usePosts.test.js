import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '../../lib/supabase'
import { usePosts } from '../usePosts'

const mockPosts = [
  { id: '1', title: 'Post A', slug: 'post-a', tags: ['CI/CD'], published: true },
  { id: '2', title: 'Post B', slug: 'post-b', tags: ['測試策略'], published: true },
]

describe('usePosts', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
    })
  })

  it('returns all posts when no tag filter', async () => {
    const { result } = renderHook(() => usePosts())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.posts).toHaveLength(2)
  })

  it('filters posts by tag', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [mockPosts[0]],
        error: null,
      }),
    })
    const { result } = renderHook(() => usePosts('CI/CD'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.posts).toHaveLength(1)
    expect(result.current.posts[0].title).toBe('Post A')
  })
})
