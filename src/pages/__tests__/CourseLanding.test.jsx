import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../hooks/useCourse', () => ({
  useCourse: vi.fn(),
  adjacentChapters: vi.fn(),
}))
vi.mock('../../hooks/useReadHistory', () => ({
  useReadHistory: () => ({ isRead: s => s === 'c1', markRead: vi.fn() }),
}))
vi.mock('../../components/Nav', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('react-helmet-async', () => ({ Helmet: () => null }))

import { useCourse } from '../../hooks/useCourse'
import CourseLanding from '../CourseLanding'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/course/:slug" element={<CourseLanding />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CourseLanding', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders chapter list and read progress', () => {
    useCourse.mockReturnValue({
      course: { title: 'QA 溝通課', subtitle: '問對問題', description: '簡介', cover_url: null },
      chapters: [
        { slug: 'c1', title: '第一章', course_order: 1 },
        { slug: 'c2', title: '第二章', course_order: 2 },
      ],
      loading: false,
      notFound: false,
    })
    renderAt('/course/qa-comm')
    expect(screen.getByText('QA 溝通課')).toBeInTheDocument()
    expect(screen.getByText('第一章')).toBeInTheDocument()
    expect(screen.getByText('第二章')).toBeInTheDocument()
    expect(screen.getByText('1 / 2 章已讀')).toBeInTheDocument()
  })

  it('shows not found message', () => {
    useCourse.mockReturnValue({ course: null, chapters: [], loading: false, notFound: true })
    renderAt('/course/missing')
    expect(screen.getByText('找不到課程')).toBeInTheDocument()
  })
})
