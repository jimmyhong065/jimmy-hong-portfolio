import { useState } from 'react'

const KEY = 'blog-bookmarks'

function readStorage() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function writeStorage(value) {
  try { localStorage.setItem(KEY, JSON.stringify(value)) } catch {}
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(readStorage)

  function toggle(slug) {
    const next = bookmarks.includes(slug)
      ? bookmarks.filter(s => s !== slug)
      : [...bookmarks, slug]
    setBookmarks(next)
    writeStorage(next)
  }

  function isBookmarked(slug) { return bookmarks.includes(slug) }

  return { bookmarks, toggle, isBookmarked }
}
