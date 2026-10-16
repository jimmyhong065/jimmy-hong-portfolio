import { describe, it, expect } from 'vitest'
import { contentToBodyHtml } from '../../functions/_bodyHtml.js'

describe('contentToBodyHtml', () => {
  it('keeps markdown internal links as absolute <a href>', () => {
    const html = contentToBodyHtml('看 [QA Brain](/blog/qa-brain) 這篇')
    expect(html).toBe('看 <a href="https://qa-lens.com/blog/qa-brain">QA Brain</a> 這篇')
  })

  it('keeps external links', () => {
    expect(contentToBodyHtml('[SO](https://survey.stackoverflow.co/2025/ai)'))
      .toBe('<a href="https://survey.stackoverflow.co/2025/ai">SO</a>')
  })

  it('keeps <a> links from admin-edited HTML content', () => {
    const html = contentToBodyHtml('<p>見 <a href="/blog/x" target="_blank">X 文</a></p>')
    expect(html).toBe('見 <a href="https://qa-lens.com/blog/x">X 文</a>')
  })

  it('drops anchor and unsafe links but keeps their text', () => {
    expect(contentToBodyHtml('[目錄](#top) [壞](javascript:void)')).toBe('目錄 壞')
  })

  it('escapes text and ignores links inside code blocks', () => {
    const html = contentToBodyHtml('a < b\n```\n[x](/blog/y)\n```\n**粗**')
    expect(html).toBe('a &lt; b 粗')
  })

  it('strips images and markdown markers', () => {
    expect(contentToBodyHtml('## 標題\n![圖](/a.png) 內文')).toBe('標題 內文')
  })
})

describe('contentToBodyHtml callout markers', () => {
  it('strips [!TIP] style markers from markdown and HTML', () => {
    expect(contentToBodyHtml('> [!TIP]\n> 把等待收進 BasePage')).not.toContain('[!TIP]')
    expect(contentToBodyHtml('<blockquote><p>[!warning] 別加 retry</p></blockquote>')).not.toMatch(/\[!warning\]/i)
  })
})

describe('contentToBodyHtml compare markers', () => {
  it('strips [!BAD] and [!GOOD]', () => {
    const out = contentToBodyHtml('> [!BAD] 舊寫法\n\n> [!GOOD] 新寫法')
    expect(out).not.toMatch(/\[!(BAD|GOOD)\]/)
  })
})
