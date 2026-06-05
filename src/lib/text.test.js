import { describe, it, expect } from 'vitest'
import { stripMarkdown } from './text'

describe('stripMarkdown', () => {
  it('strips inline links', () => {
    expect(stripMarkdown('[text](https://example.com)')).toBe('text')
  })
  it('strips images', () => {
    expect(stripMarkdown('![alt text](https://example.com/img.png)')).toBe('')
  })
  it('strips bold and italic', () => {
    expect(stripMarkdown('**bold** and _italic_')).toBe('bold and italic')
  })
  it('strips headings', () => {
    expect(stripMarkdown('# Title')).toBe('Title')
  })
  it('strips blockquotes', () => {
    expect(stripMarkdown('> quoted text')).toBe('quoted text')
  })
  it('strips unordered list markers', () => {
    expect(stripMarkdown('- item one\n- item two')).toBe('item one item two')
  })
  it('strips ordered list markers', () => {
    expect(stripMarkdown('1. first\n2. second')).toBe('first second')
  })
  it('strips code backticks', () => {
    expect(stripMarkdown('use `code` here')).toBe('use code here')
  })
  it('normalizes whitespace', () => {
    expect(stripMarkdown('hello   world')).toBe('hello world')
  })
  it('handles null', () => {
    expect(stripMarkdown(null)).toBe('')
  })
  it('handles undefined', () => {
    expect(stripMarkdown(undefined)).toBe('')
  })
  it('handles empty string', () => {
    expect(stripMarkdown('')).toBe('')
  })
})
