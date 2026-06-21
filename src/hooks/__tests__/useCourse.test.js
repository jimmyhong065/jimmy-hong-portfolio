import { renderHook, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({ supabase: { from: vi.fn() } }))
import { supabase } from '../../lib/supabase'
import { useCourse } from '../useCourse'

function mockCourseQueries({ course, chapters }) {
  const coursesBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: course, error: null }),
  }
  const postsBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: chapters, error: null }),
  }
  supabase.from.mockImplementation(table =>
    table === 'courses' ? coursesBuilder : postsBuilder
  )
  return { coursesBuilder, postsBuilder }
}

describe('useCourse', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns course and chapters sorted by course_order', async () => {
    mockCourseQueries({
      course: { id: 'k1', slug: 'qa-comm', title: 'QA 溝通課', published: true },
      chapters: [
        { slug: 'c1', title: 'A', course_order: 1, published: true },
        { slug: 'c2', title: 'B', course_order: 2, published: true },
      ],
    })
    const { result } = renderHook(() => useCourse('qa-comm', { preview: false }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.course.title).toBe('QA 溝通課')
    expect(result.current.chapters).toHaveLength(2)
    expect(result.current.notFound).toBe(false)
  })

  it('unpublished course is notFound when not preview', async () => {
    mockCourseQueries({
      course: { id: 'k1', slug: 'qa-comm', title: 'x', published: false },
      chapters: [],
    })
    const { result } = renderHook(() => useCourse('qa-comm', { preview: false }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notFound).toBe(true)
  })

  it('unpublished course is visible in preview', async () => {
    mockCourseQueries({
      course: { id: 'k1', slug: 'qa-comm', title: 'x', published: false },
      chapters: [{ slug: 'c1', title: 'A', course_order: 1, published: false }],
    })
    const { result } = renderHook(() => useCourse('qa-comm', { preview: true }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notFound).toBe(false)
    expect(result.current.chapters).toHaveLength(1)
  })
})

import { describe, it, expect } from 'vitest'
import { adjacentChapters } from '../useCourse'

const chapters = [
  { slug: 'c1', course_order: 1 },
  { slug: 'c2', course_order: 2 },
  { slug: 'c3', course_order: 3 },
]

describe('adjacentChapters', () => {
  it('returns prev and next for a middle chapter', () => {
    expect(adjacentChapters(chapters, 'c2')).toEqual({
      prev: chapters[0],
      next: chapters[2],
    })
  })

  it('first chapter has no prev', () => {
    expect(adjacentChapters(chapters, 'c1')).toEqual({ prev: null, next: chapters[1] })
  })

  it('last chapter has no next', () => {
    expect(adjacentChapters(chapters, 'c3')).toEqual({ prev: chapters[1], next: null })
  })

  it('unknown slug returns nulls', () => {
    expect(adjacentChapters(chapters, 'x')).toEqual({ prev: null, next: null })
  })
})
