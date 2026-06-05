export function stripMarkdown(text) {
  return (text ?? '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/[*_~`#>]/g, '')
    .replace(/^\s*[-*+\d.]+\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function chunkArray(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}
