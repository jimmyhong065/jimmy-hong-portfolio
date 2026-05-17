import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import PhotoNav from '../PhotoNav'

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: { email: 'test@example.com' } }),
}))

describe('PhotoNav', () => {
  function renderNav() {
    return render(
      <MemoryRouter>
        <PhotoNav />
      </MemoryRouter>
    )
  }

  it('renders brand name centered', () => {
    renderNav()
    expect(screen.getByText('r.bing recording')).toBeInTheDocument()
  })

  it('renders 作品集 link on left', () => {
    renderNav()
    expect(screen.getByText('作品集')).toBeInTheDocument()
  })

  it('renders Instagram link', () => {
    renderNav()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('renders QA 網站 link on right', () => {
    renderNav()
    expect(screen.getByText('QA 網站')).toBeInTheDocument()
  })

  it('renders 聯絡我 when email is set', () => {
    renderNav()
    expect(screen.getByText('聯絡我')).toBeInTheDocument()
  })
})
