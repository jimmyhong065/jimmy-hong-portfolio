import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: { email: 'test@example.com' } }),
}))

import PhotoNav from '../PhotoNav'

describe('PhotoNav', () => {
  it('renders studio name linking to /photo', () => {
    render(<MemoryRouter><PhotoNav /></MemoryRouter>)
    const logo = screen.getByText('r.bing recording')
    expect(logo.closest('a')).toHaveAttribute('href', '/photo')
  })

  it('renders link back to QA site', () => {
    render(<MemoryRouter><PhotoNav /></MemoryRouter>)
    expect(screen.getByText('QA 網站')).toBeInTheDocument()
  })

  it('renders contact button when email is set', () => {
    render(<MemoryRouter><PhotoNav /></MemoryRouter>)
    expect(screen.getByText('聯絡我')).toBeInTheDocument()
  })
})
