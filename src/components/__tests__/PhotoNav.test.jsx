import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import PhotoNav from '../PhotoNav'

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: { email: 'test@example.com' } }),
}))

describe('PhotoNav', () => {
  function renderNav(initialPath = '/photo') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <PhotoNav />
      </MemoryRouter>
    )
  }

  it('renders brand name', () => {
    renderNav()
    expect(screen.getByText('r.bing recording')).toBeInTheDocument()
  })

  it('renders 作品集 in both desktop nav and tab bar', () => {
    renderNav()
    expect(screen.getAllByText('作品集')).toHaveLength(2)
  })

  it('renders Instagram in both desktop nav and tab bar', () => {
    renderNav()
    expect(screen.getAllByText('Instagram')).toHaveLength(2)
  })

  it('renders QA 網站 in both desktop nav and tab bar', () => {
    renderNav()
    expect(screen.getAllByText('QA 網站')).toHaveLength(2)
  })

  it('renders 聯絡我 in both desktop nav and tab bar when email is set', () => {
    renderNav()
    expect(screen.getAllByText('聯絡我')).toHaveLength(2)
  })

  it('marks 作品集 tab active when on /photo route', () => {
    renderNav('/photo')
    const links = screen.getAllByText('作品集')
    const tabBarLink = links[1].closest('a')
    expect(tabBarLink).toHaveAttribute('aria-current', 'page')
  })
})
