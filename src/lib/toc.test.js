import { describe, it, expect } from 'vitest'
import { slugify, parseHeadings } from './toc'

describe('slugify', () => {
  it('lowercases ascii', () => expect(slugify('Hello World')).toBe('hello-world'))
  it('keeps chinese characters', () => expect(slugify('測試方法')).toBe('測試方法'))
  it('removes special chars', () => expect(slugify('A: B & C')).toBe('a-b--c'))
  it('trims and collapses spaces', () => expect(slugify('  foo  bar  ')).toBe('foo--bar'))
})

describe('parseHeadings', () => {
  it('extracts h2 and h3', () => {
    const md = '## First\n\nsome text\n\n### Sub\n\n## Second'
    expect(parseHeadings(md)).toEqual([
      { level: 2, text: 'First', id: 'first' },
      { level: 3, text: 'Sub', id: 'sub' },
      { level: 2, text: 'Second', id: 'second' },
    ])
  })
  it('ignores h1', () => {
    expect(parseHeadings('# Title\n## Section')).toHaveLength(1)
  })
  it('returns empty array for no headings', () => {
    expect(parseHeadings('just text')).toEqual([])
  })
})
