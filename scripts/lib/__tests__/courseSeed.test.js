import { describe, it, expect } from 'vitest'
import { parseChapterFile, chapterSlug, courseShort } from '../courseSeed.js'

describe('parseChapterFile', () => {
  it('抽出 key 與 order', () => {
    expect(parseChapterFile('article-S01-why-qa-second-brain.md')).toEqual({ key: 'S01', order: 1 })
    expect(parseChapterFile('article-A12-foo.md')).toEqual({ key: 'A12', order: 12 })
    expect(parseChapterFile('article-L20-bar-baz.md')).toEqual({ key: 'L20', order: 20 })
  })
  it('非章節檔回 null', () => {
    expect(parseChapterFile('README.md')).toBeNull()
    expect(parseChapterFile('_preview.html')).toBeNull()
  })
})

describe('courseShort', () => {
  it('去掉 course- 前綴', () => {
    expect(courseShort('course-second-brain')).toBe('second-brain')
    expect(courseShort('course-perf')).toBe('perf')
  })
})

describe('chapterSlug', () => {
  it('課短名 + 檔名base，小寫', () => {
    expect(chapterSlug('course-second-brain', 'article-S01-why-qa-second-brain.md'))
      .toBe('second-brain-s01-why-qa-second-brain')
  })
})
