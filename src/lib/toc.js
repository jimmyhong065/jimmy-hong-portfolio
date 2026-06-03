export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s一-鿿-]/g, '')
    .trim()
    .replace(/\s+/g, (match) => '-'.repeat(match.length))
}

function extractCustomId(raw) {
  const m = raw.match(/\s*\{#([^}]+)\}\s*$/)
  return m ? m[1] : null
}

function stripCustomId(raw) {
  return raw.replace(/\s*\{#[^}]+\}\s*$/, '').trim()
}

export function headingId(raw) {
  return extractCustomId(raw) ?? slugify(stripCustomId(raw))
}

export function headingText(raw) {
  return stripCustomId(raw)
}

export function parseHeadings(markdown) {
  const matches = [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)]
  return matches.map(([, hashes, raw]) => {
    const trimmed = raw.trim()
    return {
      level: hashes.length,
      text: headingText(trimmed),
      id: headingId(trimmed),
    }
  })
}
