import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Nav from '../Nav'

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: { email: 'test@example.com' } }),
}))

function renderNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Nav />
    </MemoryRouter>
  )
}

describe('Nav', () => {
  it('renders brand link', () => {
    renderNav()
    expect(screen.getByText('Jimmy Hong')).toBeInTheDocument()
  })

  it('renders all 5 tab labels in bottom bar', () => {
    renderNav()
    // Tab bar has: 作品集, 部落格, 收藏, FAQ, 關於我
    expect(screen.getAllByText('作品集')).toHaveLength(2) // desktop nav + tab bar
    expect(screen.getAllByText('部落格')).toHaveLength(2) // desktop nav + tab bar
    expect(screen.getByText('收藏')).toBeInTheDocument() // only in tab bar
    expect(screen.getAllByText('FAQ')).toHaveLength(2) // desktop nav + tab bar
    expect(screen.getAllByText('關於我')).toHaveLength(2) // desktop nav + tab bar
    // Desktop nav still has 合作方式
    expect(screen.getByText('合作方式')).toBeInTheDocument()
  })

  it('marks /projects tab active when on projects route', () => {
    renderNav('/projects')
    const tabLinks = screen.getAllByText('作品集')
    const tabBarLink = tabLinks[1].closest('a')
    expect(tabBarLink).toHaveAttribute('aria-current', 'page')
  })

  it('marks /projects tab active for nested routes like /projects/1', () => {
    renderNav('/projects/1')
    const tabLinks = screen.getAllByText('作品集')
    const tabBarLink = tabLinks[1].closest('a')
    expect(tabBarLink).toHaveAttribute('aria-current', 'page')
  })

  it('inactive tabs use text-gray-400', () => {
    renderNav('/projects')
    const blogLinks = screen.getAllByText('部落格')
    const tabBarLink = blogLinks[1].closest('a')
    expect(tabBarLink).not.toHaveAttribute('aria-current')
  })
})
