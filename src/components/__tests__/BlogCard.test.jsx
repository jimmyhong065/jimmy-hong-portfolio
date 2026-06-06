import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import BlogCard from '../BlogCard'

vi.mock('../../contexts/SiteSettingsContext', () => ({
  useSiteSettings: vi.fn(),
}))

import { useSiteSettings } from '../../contexts/SiteSettingsContext'

const post = {
  id: '1',
  title: 'Test Post Title',
  slug: 'test-post',
  excerpt: 'This is the excerpt text for testing.',
  tags: ['QA', 'Testing', 'CI/CD', 'ExtraTag'],
  published_at: '2026-06-04T00:00:00Z',
}

function renderCard(p = post, isRead = false) {
  return render(<MemoryRouter><BlogCard post={p} isRead={isRead} /></MemoryRouter>)
}

beforeEach(() => {
  useSiteSettings.mockReturnValue({ settings: { card_style: 'shadowed' } })
})

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

  it('shows ✓ badge when isRead is true', () => {
    renderCard(post, true)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('does not show ✓ badge when isRead is false', () => {
    renderCard(post, false)
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
  })
})

describe('BlogCard card_style', () => {
  it('applies shadow classes for shadowed style', () => {
    useSiteSettings.mockReturnValue({ settings: { card_style: 'shadowed' } })
    const { container } = render(<MemoryRouter><BlogCard post={post} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('shadow-sm')
  })

  it('applies border classes for bordered style', () => {
    useSiteSettings.mockReturnValue({ settings: { card_style: 'bordered' } })
    const { container } = render(<MemoryRouter><BlogCard post={post} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('border-gray-200')
    expect(container.firstChild.className).not.toContain('shadow-sm')
  })

  it('applies no shadow for minimal style', () => {
    useSiteSettings.mockReturnValue({ settings: { card_style: 'minimal' } })
    const { container } = render(<MemoryRouter><BlogCard post={post} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('shadow-none')
    expect(container.firstChild.className).not.toContain('shadow-sm')
  })
})
