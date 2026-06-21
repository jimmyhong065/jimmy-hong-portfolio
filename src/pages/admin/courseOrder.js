// 上/下移一個章節，回新陣列並重編 course_order（1 起）。邊界回原陣列（同參考）。
export function moveChapter(chapters, index, dir) {
  const target = index + (dir === 'up' ? -1 : 1)
  if (target < 0 || target >= chapters.length) return chapters
  const next = [...chapters]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next.map((c, i) => ({ ...c, course_order: i + 1 }))
}
