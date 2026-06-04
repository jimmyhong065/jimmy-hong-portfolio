import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import BlogCard from '../BlogCard'

const post = {
  id: '1',
  title: 'Test Post Title',
  slug: 'test-post',
  excerpt: 'This is the excerpt text for testing.',
  tags: ['QA', 'Testing', 'CI/CD', 'ExtraTag'],
  published_at: '2026-06-04T00:00:00Z',
}

function renderCard(p = post) {
  return render(<MemoryRouter><BlogCard post={p} /></MemoryRouter>)
}

describe('BlogCard', () => {
  it('renders title', () => {
    renderCard()
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
  })

  it('renders excerpt', () => {
    renderCard()
    expect(screen.getByText('This is the excerpt text for testing.')).toBeInTheDocument()
  })

  it('renders formatted date', () => {
    renderCard()
    expect(screen.getByText('2026-06-04')).toBeInTheDocument()
  })

  it('shows at most 3 tags', () => {
    renderCard()
    expect(screen.getByText('QA')).toBeInTheDocument()
    expect(screen.getByText('Testing')).toBeInTheDocument()
    expect(screen.getByText('CI/CD')).toBeInTheDocument()
    expect(screen.queryByText('ExtraTag')).not.toBeInTheDocument()
  })

  it('links to correct post URL', () => {
    renderCard()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/test-post')
  })

  it('renders without excerpt (null) gracefully', () => {
    renderCard({ ...post, excerpt: null })
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
  })

  it('renders without tags (null) gracefully', () => {
    renderCard({ ...post, tags: null })
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
  })

  it('renders without published_at gracefully', () => {
    renderCard({ ...post, published_at: null })
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
  })
})
