import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import PhotoCard from '../PhotoCard'

const mockProject = {
  id: 'abc123',
  title: 'Wedding Series',
  tags: ['人像', '婚禮'],
  cover_url: 'https://example.com/photo.jpg',
}

describe('PhotoCard', () => {
  it('renders title', () => {
    render(<MemoryRouter><PhotoCard project={mockProject} /></MemoryRouter>)
    expect(screen.getByText('Wedding Series')).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<MemoryRouter><PhotoCard project={mockProject} /></MemoryRouter>)
    expect(screen.getByText('人像')).toBeInTheDocument()
    expect(screen.getByText('婚禮')).toBeInTheDocument()
  })

  it('links to /photo/:id', () => {
    render(<MemoryRouter><PhotoCard project={mockProject} /></MemoryRouter>)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/photo/abc123')
  })
})
