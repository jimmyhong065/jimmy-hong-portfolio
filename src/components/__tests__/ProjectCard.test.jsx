import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'
import ProjectCard from '../ProjectCard'

const PROJECT = { id: '1', title: 'Test', description: 'Desc', tags: [], cover_url: null }

vi.mock('../../contexts/SiteSettingsContext', () => ({
  useSiteSettings: vi.fn(),
}))

import { useSiteSettings } from '../../contexts/SiteSettingsContext'

describe('ProjectCard card_style', () => {
  it('applies shadow classes for shadowed style', () => {
    useSiteSettings.mockReturnValue({ settings: { card_style: 'shadowed' } })
    const { container } = render(<MemoryRouter><ProjectCard project={PROJECT} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('shadow-sm')
    expect(container.firstChild.className).toContain('hover:shadow-md')
  })

  it('applies border-only classes for bordered style', () => {
    useSiteSettings.mockReturnValue({ settings: { card_style: 'bordered' } })
    const { container } = render(<MemoryRouter><ProjectCard project={PROJECT} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('hover:border-gray-400')
    expect(container.firstChild.className).not.toContain('hover:shadow-md')
  })

  it('applies no shadow for minimal style', () => {
    useSiteSettings.mockReturnValue({ settings: { card_style: 'minimal' } })
    const { container } = render(<MemoryRouter><ProjectCard project={PROJECT} /></MemoryRouter>)
    expect(container.firstChild.className).toContain('shadow-none')
    expect(container.firstChild.className).not.toContain('hover:shadow-md')
  })
})
