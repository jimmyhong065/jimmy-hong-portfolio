import { describe, it, expect } from 'vitest'
import { moveChapter } from '../courseOrder.js'

const ch = [
  { id: 'a', course_order: 1 }, { id: 'b', course_order: 2 }, { id: 'c', course_order: 3 },
]
describe('moveChapter', () => {
  it('上移交換並重編 order', () => {
    const r = moveChapter(ch, 1, 'up')
    expect(r.map(c => c.id)).toEqual(['b', 'a', 'c'])
    expect(r.map(c => c.course_order)).toEqual([1, 2, 3])
  })
  it('下移', () => {
    expect(moveChapter(ch, 0, 'down').map(c => c.id)).toEqual(['b', 'a', 'c'])
  })
  it('邊界不動', () => {
    expect(moveChapter(ch, 0, 'up')).toBe(ch)
    expect(moveChapter(ch, 2, 'down')).toBe(ch)
  })
})
