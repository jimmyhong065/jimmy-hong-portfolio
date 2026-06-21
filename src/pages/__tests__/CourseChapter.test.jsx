import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-helmet-async', () => ({ Helmet: () => null }))

vi.mock('../../hooks/useCourse', () => ({
  useCourse: vi.fn(),
  adjacentChapters: vi.fn(() => ({ prev: null, next: { slug: 'c2', title: '第二章' } })),
}))
vi.mock('../../hooks/useReadingProgress', () => ({ useReadingProgress: () => 0 }))
vi.mock('../../hooks/useReadHistory', () => ({
  useReadHistory: () => ({ isRead: () => false, markRead: vi.fn() }),
}))
vi.mock('../../components/MarkdownContent', () => ({
  default: ({ content }) => <div data-testid="md">{content}</div>,
}))
vi.mock('../../components/Nav', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))

const chapterPost = { slug: 'c1', title: '第一章', content: '# 第一章\n內文內容' }

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: chapterPost, error: null }) }),
          single: () => Promise.resolve({ data: chapterPost, error: null }),
        }),
      }),
    }),
  },
}))

import { useCourse } from '../../hooks/useCourse'
import CourseChapter from '../CourseChapter'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/course/:slug/:chapterSlug" element={<CourseChapter />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CourseChapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCourse.mockReturnValue({
      course: { title: 'QA 溝通課' },
      chapters: [{ slug: 'c1', title: '第一章' }, { slug: 'c2', title: '第二章' }],
      loading: false,
      notFound: false,
    })
  })

  it('renders chapter content and next-chapter nav', async () => {
    renderAt('/course/qa-comm/c1')
    await waitFor(() => expect(screen.getByTestId('md')).toBeInTheDocument())
    expect(screen.getByText('內文內容', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('第二章', { exact: false })).toBeInTheDocument()
  })
})
