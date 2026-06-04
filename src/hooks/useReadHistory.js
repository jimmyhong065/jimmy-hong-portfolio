import { useState } from 'react'

const KEY = 'blog-read-history'

function readStorage() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function writeStorage(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])) } catch {}
}

export function useReadHistory() {
  const [readSlugs, setReadSlugs] = useState(() => new Set(readStorage()))

  function markRead(slug) {
    if (readSlugs.has(slug)) return
    const next = new Set(readSlugs)
    next.add(slug)
    setReadSlugs(next)
    writeStorage(next)
  }

  function isRead(slug) { return readSlugs.has(slug) }

  return { markRead, isRead }
}
