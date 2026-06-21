export function adjacentChapters(chapters, slug) {
  const i = chapters.findIndex(c => c.slug === slug)
  if (i === -1) return { prev: null, next: null }
  return {
    prev: i > 0 ? chapters[i - 1] : null,
    next: i < chapters.length - 1 ? chapters[i + 1] : null,
  }
}
