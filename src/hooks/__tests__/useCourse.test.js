import { describe, it, expect } from 'vitest'
import { adjacentChapters } from '../useCourse'

const chapters = [
  { slug: 'c1', course_order: 1 },
  { slug: 'c2', course_order: 2 },
  { slug: 'c3', course_order: 3 },
]

describe('adjacentChapters', () => {
  it('returns prev and next for a middle chapter', () => {
    expect(adjacentChapters(chapters, 'c2')).toEqual({
      prev: chapters[0],
      next: chapters[2],
    })
  })

  it('first chapter has no prev', () => {
    expect(adjacentChapters(chapters, 'c1')).toEqual({ prev: null, next: chapters[1] })
  })

  it('last chapter has no next', () => {
    expect(adjacentChapters(chapters, 'c3')).toEqual({ prev: chapters[1], next: null })
  })

  it('unknown slug returns nulls', () => {
    expect(adjacentChapters(chapters, 'x')).toEqual({ prev: null, next: null })
  })
})
