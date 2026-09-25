// 系列（courses）列表的純函式：彙整章節數與標籤、依文章標籤挑相關系列

// courses 依傳入順序保留；只留至少有一篇已發布章節的系列
export function summarizeSeries(courses, chapters) {
  const byCourse = new Map()
  for (const ch of chapters ?? []) {
    const entry = byCourse.get(ch.course_id) ?? { count: 0, tags: new Set() }
    entry.count += 1
    for (const t of ch.tags ?? []) entry.tags.add(t)
    byCourse.set(ch.course_id, entry)
  }
  return (courses ?? [])
    .filter(c => byCourse.has(c.id))
    .map(c => ({ ...c, chapterCount: byCourse.get(c.id).count, tags: byCourse.get(c.id).tags }))
}

// 依標籤重疊數排序（不分大小寫），沒有重疊的不推
export function pickSeriesForTags(series, tags, limit = 2) {
  const wanted = new Set((tags ?? []).map(t => t.toLowerCase()))
  return series
    .map(s => ({ s, score: [...s.tags].filter(t => wanted.has(t.toLowerCase())).length }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.s)
}
