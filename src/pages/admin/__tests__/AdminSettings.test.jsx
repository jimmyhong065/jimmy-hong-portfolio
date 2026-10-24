import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

vi.mock('../../../contexts/SiteSettingsContext', () => ({
  useSiteSettings: () => ({ refresh: vi.fn() }),
}))
vi.mock('../../../hooks/useUpload', () => ({
  useUpload: () => ({ uploading: false, uploadError: null, uploadOne: vi.fn() }),
}))
vi.mock('../../../lib/supabase', () => ({
  supabase: { from: vi.fn(() => ({
    select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null }) })) })),
  })) },
}))
vi.mock('../../../components/MfaFactorManager', () => ({
  default: () => <section>登入安全性</section>,
}))

import AdminSettings from '../AdminSettings'

it('renders login security outside the site settings form', () => {
  const { container } = render(<AdminSettings />)
  const security = screen.getByText('登入安全性')
  expect(security).toBeInTheDocument()
  expect(container.querySelector('form')?.contains(security)).toBe(false)
})
