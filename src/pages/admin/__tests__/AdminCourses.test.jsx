import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminCourses from '../AdminCourses'

vi.mock('../../../lib/supabase', () => {
  const COURSES = [
    { id: '1', title: 'QA 的第二大腦', slug: 'course-second-brain', published: false, display_order: 6, chapter_count: 9 },
    { id: '2', title: '效能測試課', slug: 'course-perf', published: false, display_order: 1, chapter_count: 20 },
  ]
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: COURSES }),
      })),
    }
  }
})

it('顯示課名與章節數', async () => {
  render(<MemoryRouter><AdminCourses /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText('QA 的第二大腦')).toBeInTheDocument())
  expect(screen.getByText('效能測試課')).toBeInTheDocument()
  expect(screen.getByText(/9/)).toBeInTheDocument()
})
