import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import { usePhotoProjects } from '../usePhotoProjects'

const mockProjects = [
  { id: '1', title: 'Portrait A', tags: ['人像'], display_order: 0 },
  { id: '2', title: 'Event B', tags: ['活動'], display_order: 1 },
]

describe('usePhotoProjects', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
    })
  })

  it('returns all photo projects when no tag filter', async () => {
    const { result } = renderHook(() => usePhotoProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toHaveLength(2)
  })
})
