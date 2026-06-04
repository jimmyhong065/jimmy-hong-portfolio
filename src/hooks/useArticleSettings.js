import { useState } from 'react'

const SIZES = ['sm', 'md', 'lg']

function readStorage(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value) } catch {}
}

export function useArticleSettings() {
  const [fontSize, setFontSize] = useState(() => {
    const stored = readStorage('article-font-size', 'md')
    return SIZES.includes(stored) ? stored : 'md'
  })
  const [dark, setDark] = useState(() => readStorage('article-theme', 'light') === 'dark')

  function incFontSize() {
    setFontSize(prev => {
      const next = SIZES[Math.min(SIZES.indexOf(prev) + 1, SIZES.length - 1)]
      writeStorage('article-font-size', next)
      return next
    })
  }

  function decFontSize() {
    setFontSize(prev => {
      const next = SIZES[Math.max(SIZES.indexOf(prev) - 1, 0)]
      writeStorage('article-font-size', next)
      return next
    })
  }

  function toggleDark() {
    setDark(prev => {
      const next = !prev
      writeStorage('article-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return { fontSize, dark, incFontSize, decFontSize, toggleDark }
}
