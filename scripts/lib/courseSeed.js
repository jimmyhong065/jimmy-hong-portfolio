// 課程 seed 用純函式（無 IO，可單測）

// 'article-S01-foo.md' -> { key: 'S01', order: 1 }；非章節檔回 null
export function parseChapterFile(filename) {
  const m = filename.match(/^article-([A-Za-z]+\d+)-.*\.md$/)
  if (!m) return null
  const key = m[1].toUpperCase()
  const order = parseInt(key.replace(/\D/g, ''), 10)
  return { key, order }
}

// 'course-second-brain' -> 'second-brain'
export function courseShort(courseSlug) {
  return courseSlug.replace(/^course-/, '')
}

// 章節 slug：課短名 + 檔名base（去 article- 與 .md），全小寫
export function chapterSlug(courseSlug, filename) {
  const base = filename.replace(/^article-/, '').replace(/\.md$/, '')
  return `${courseShort(courseSlug)}-${base}`.toLowerCase()
}
