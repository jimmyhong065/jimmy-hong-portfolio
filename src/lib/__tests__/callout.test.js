import { describe, it, expect } from 'vitest'
import { applyCalloutsToHtml, CALLOUT_LABELS } from '../callout'

describe('applyCalloutsToHtml', () => {
  it('turns a marked blockquote into a callout with a title', () => {
    const out = applyCalloutsToHtml('<blockquote><p>[!TIP] 用 BasePage 收等待</p></blockquote>')
    const doc = new DOMParser().parseFromString(out, 'text/html')
    const bq = doc.querySelector('blockquote')
    expect(bq.classList.contains('callout')).toBe(true)
    expect(bq.classList.contains('callout-tip')).toBe(true)
    expect(bq.querySelector('.callout-title').textContent).toBe(CALLOUT_LABELS.tip)
    expect(bq.textContent).not.toContain('[!TIP]')
    expect(bq.textContent).toContain('用 BasePage 收等待')
  })

  it('handles marker on its own line (marked output) and <br>', () => {
    const fromMarked = applyCalloutsToHtml('<blockquote>\n<p>[!WARNING]\n別直接加 retry</p>\n</blockquote>')
    expect(fromMarked).toContain('callout-warning')
    expect(fromMarked).not.toContain('[!WARNING]')
    const withBr = applyCalloutsToHtml('<blockquote><p>[!case]<br>情境</p></blockquote>')
    expect(withBr).toContain('callout-case')
    expect(withBr).not.toMatch(/<p><br>/)
  })

  it('drops the paragraph when it only held the marker', () => {
    const out = applyCalloutsToHtml('<blockquote><p>[!KEY]</p><p>重點句</p></blockquote>')
    const bq = new DOMParser().parseFromString(out, 'text/html').querySelector('blockquote')
    expect(bq.querySelectorAll('p')).toHaveLength(2)
    expect(bq.querySelectorAll('p')[1].textContent).toBe('重點句')
  })

  it('leaves plain and unknown-type blockquotes alone', () => {
    const plain = '<blockquote><p>一般引用</p></blockquote>'
    expect(applyCalloutsToHtml(plain)).toBe(plain)
    const unknown = applyCalloutsToHtml('<blockquote><p>[!FOO] x</p></blockquote>')
    expect(unknown).not.toContain('callout')
  })
})
