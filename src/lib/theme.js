import tinycolor from 'tinycolor2'

export function deriveColorPalette(hex) {
  const base = tinycolor(hex)
  if (!base.isValid()) return deriveColorPalette('#111827')
  return {
    accent: base.toHexString(),
    hover: base.clone().darken(15).toHexString(),
    light: base.clone().lighten(35).setAlpha(0.2).toRgbString(),
    text: base.isLight() ? '#111827' : '#ffffff',
  }
}

export function applyTheme({ accent_color, font_family, bg_color, heading_font }) {
  if (typeof document === 'undefined') return
  const palette = deriveColorPalette(accent_color ?? '#111827')
  const root = document.documentElement
  root.style.setProperty('--color-accent', palette.accent)
  root.style.setProperty('--color-accent-hover', palette.hover)
  root.style.setProperty('--color-accent-light', palette.light)
  root.style.setProperty('--color-accent-text', palette.text)

  const bg = bg_color ?? '#ffffff'
  root.style.setProperty('--color-bg', bg)
  const textPrimary = tinycolor(bg).isLight() ? '#111827' : '#f1f5f9'
  root.style.setProperty('--color-text-primary', textPrimary)
  document.body.style.backgroundColor = bg

  const font = font_family ?? 'Noto Sans TC'
  root.style.setProperty('--font-body', `"${font}", sans-serif`)

  let link = document.getElementById('google-font-theme')
  if (!link) {
    link = document.createElement('link')
    link.id = 'google-font-theme'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;700&display=swap`

  const hFont = heading_font ?? font
  root.style.setProperty('--font-heading', `"${hFont}", sans-serif`)

  let hLink = document.getElementById('google-font-heading')
  if (!hLink) {
    hLink = document.createElement('link')
    hLink.id = 'google-font-heading'
    hLink.rel = 'stylesheet'
    document.head.appendChild(hLink)
  }
  hLink.href = `https://fonts.googleapis.com/css2?family=${hFont.replace(/ /g, '+')}:wght@400;500;700&display=swap`
}
