import { describe, it, expect, beforeEach } from 'vitest'
import { deriveColorPalette, applyTheme } from '../theme'

describe('deriveColorPalette', () => {
  it('returns accent as hex string matching input', () => {
    const p = deriveColorPalette('#3b82f6')
    expect(p.accent.toLowerCase()).toBe('#3b82f6')
  })

  it('hover is different from accent', () => {
    const p = deriveColorPalette('#3b82f6')
    expect(p.hover).not.toBe(p.accent)
  })

  it('returns white text for dark accent color', () => {
    const p = deriveColorPalette('#111827')
    expect(p.text).toBe('#ffffff')
  })

  it('returns dark text for light accent color', () => {
    const p = deriveColorPalette('#f9fafb')
    expect(p.text).toBe('#111827')
  })
})

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
    document.head.innerHTML = ''
  })

  it('sets --color-accent CSS variable on root', () => {
    applyTheme({ accent_color: '#3b82f6', font_family: 'Inter' })
    const val = document.documentElement.style.getPropertyValue('--color-accent')
    expect(val).not.toBe('')
  })

  it('injects a Google Font link tag', () => {
    applyTheme({ accent_color: '#3b82f6', font_family: 'Inter' })
    const link = document.getElementById('google-font-theme')
    expect(link).not.toBeNull()
    expect(link.href).toContain('Inter')
  })

  it('reuses existing link tag instead of creating a new one', () => {
    applyTheme({ accent_color: '#3b82f6', font_family: 'Inter' })
    applyTheme({ accent_color: '#3b82f6', font_family: 'Roboto' })
    const links = document.querySelectorAll('#google-font-theme')
    expect(links.length).toBe(1)
    expect(links[0].href).toContain('Roboto')
  })
})
