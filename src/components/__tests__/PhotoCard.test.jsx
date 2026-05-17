import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import PhotoCard from '../PhotoCard'

const project = {
  id: 'abc',
  title: '人像作品',
  cover_url: 'https://example.com/photo.jpg',
  tags: ['人像', '商業'],
}

describe('PhotoCard', () => {
  function renderCard(p = project) {
    return render(
      <MemoryRouter>
        <PhotoCard project={p} />
      </MemoryRouter>
    )
  }

  it('renders title', () => {
    renderCard()
    expect(screen.getByText('人像作品')).toBeInTheDocument()
  })

  it('renders cover image with natural height (no aspect ratio class)', () => {
    renderCard()
    const img = screen.getByAltText('人像作品')
    expect(img.className).not.toMatch(/aspect-/)
    expect(img.className).toMatch(/h-auto/)
  })

  it('renders tags', () => {
    renderCard()
    expect(screen.getByText('人像')).toBeInTheDocument()
    expect(screen.getByText('商業')).toBeInTheDocument()
  })

  it('links to /photo/:id', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/photo/abc')
  })

  it('renders placeholder when no cover_url', () => {
    renderCard({ ...project, cover_url: null })
    expect(screen.queryByRole('img')).toBeNull()
  })
})
