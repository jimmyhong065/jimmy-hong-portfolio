export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s一-鿿-]/g, '')
    .trim()
    .replace(/\s+/g, (match) => '-'.repeat(match.length))
}

export function parseHeadings(markdown) {
  const matches = [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)]
  return matches.map(([, hashes, text]) => ({
    level: hashes.length,
    text: text.trim(),
    id: slugify(text.trim()),
  }))
}
