import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import { useProjects } from '../useProjects'

const mockProjects = [
  { id: '1', title: 'Project A', tags: ['自動化'], display_order: 0 },
  { id: '2', title: 'Project B', tags: ['流程設計'], display_order: 1 },
]

describe('useProjects', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
    })
  })

  it('returns all projects when no tag filter', async () => {
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toHaveLength(2)
  })
})
