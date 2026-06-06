import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'
import Footer from '../Footer'

vi.mock('../../contexts/SiteSettingsContext', () => ({
  useSiteSettings: () => ({
    settings: {
      brand_name: 'Acme QA',
      hidden_pages: ['photo'],
    },
  }),
}))

describe('Footer', () => {
  it('renders brand_name from settings', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getAllByText('Acme QA').length).toBeGreaterThan(0)
  })

  it('hides link when page in hidden_pages', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.queryByText('攝影')).toBeNull()
  })

  it('shows link when page not in hidden_pages', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getAllByText('部落格').length).toBeGreaterThan(0)
  })
})
