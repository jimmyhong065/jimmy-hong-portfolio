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

describe('compare pair (BAD + GOOD)', () => {
  it('wraps adjacent BAD then GOOD callouts in a compare container', () => {
    const out = applyCalloutsToHtml(
      '<blockquote><p>[!BAD]</p><pre><code>time.sleep(3)</code></pre></blockquote>' +
      '<blockquote><p>[!GOOD]</p><pre><code>WebDriverWait</code></pre></blockquote>'
    )
    const doc = new DOMParser().parseFromString(out, 'text/html')
    const pair = doc.querySelector('.compare-pair')
    expect(pair).not.toBeNull()
    const cols = pair.querySelectorAll(':scope > blockquote')
    expect(cols).toHaveLength(2)
    expect(cols[0].classList.contains('callout-bad')).toBe(true)
    expect(cols[1].classList.contains('callout-good')).toBe(true)
    expect(cols[0].querySelector('.callout-title').textContent).toBe(CALLOUT_LABELS.bad)
  })

  it('does not wrap a lone BAD, or GOOD before BAD', () => {
    expect(applyCalloutsToHtml('<blockquote><p>[!BAD] x</p></blockquote><p>中間</p><blockquote><p>[!GOOD] y</p></blockquote>'))
      .not.toContain('compare-pair')
    expect(applyCalloutsToHtml('<blockquote><p>[!GOOD] y</p></blockquote><blockquote><p>[!BAD] x</p></blockquote>'))
      .not.toContain('compare-pair')
  })
})

describe('bug card', () => {
  it('keeps the rest of the marker line as bug title and tags expected/actual rows (TipTap HTML)', () => {
    const out = applyCalloutsToHtml(
      '<blockquote><p>[!BUG] 冷啟動沒反應</p><ul>' +
      '<li><p><strong>環境：</strong> Android 14</p></li>' +
      '<li><p><strong>預期：</strong> 進入計時頁</p></li>' +
      '<li><p><strong>實際：</strong> 停在首頁</p></li>' +
      '</ul></blockquote>'
    )
    const bq = new DOMParser().parseFromString(out, 'text/html').querySelector('blockquote')
    expect(bq.classList.contains('callout-bug')).toBe(true)
    expect(bq.querySelector('.bug-title').textContent).toBe('冷啟動沒反應')
    const lis = bq.querySelectorAll('li')
    expect(lis[0].className).toBe('')
    expect(lis[1].classList.contains('bug-expected')).toBe(true)
    expect(lis[2].classList.contains('bug-actual')).toBe(true)
  })

  it('does not tag rows outside bug callouts', () => {
    const out = applyCalloutsToHtml('<blockquote><p>[!TIP] x</p><ul><li><strong>預期：</strong> y</li></ul></blockquote>')
    expect(out).not.toContain('bug-expected')
  })
})
