import { describe, it, expect } from 'vitest'
import {
  splitFrontmatter,
  getField,
  setField,
  normalizePunctuation,
  validateArticle,
  articleFields,
  isEditedInAdmin,
} from '../publishCore.js'

const doc = `---
title: 標題
tags: [API 測試, pytest]
---

# 標題

正文。
`

describe('splitFrontmatter', () => {
  it('分出 frontmatter 與 body', () => {
    const { fm, body } = splitFrontmatter(doc)
    expect(fm).toBe('title: 標題\ntags: [API 測試, pytest]')
    expect(body.startsWith('\n# 標題')).toBe(true)
  })
  it('沒有 frontmatter 回 null', () => {
    expect(splitFrontmatter('# hi\n').fm).toBeNull()
  })
})

describe('getField / setField', () => {
  it('讀欄位', () => {
    expect(getField(doc, 'title')).toBe('標題')
    expect(getField(doc, 'status')).toBeNull()
  })
  it('既有欄位就地取代', () => {
    const d = setField(setField(doc, 'status', 'draft'), 'status', 'published')
    expect(getField(d, 'status')).toBe('published')
    expect(d.match(/^status:/gm)).toHaveLength(1)
  })
  it('新欄位加在 frontmatter 尾端，body 不變', () => {
    const d = setField(doc, 'status', 'published')
    expect(d).toContain('tags: [API 測試, pytest]\nstatus: published\n---\n')
    expect(splitFrontmatter(d).body).toBe(splitFrontmatter(doc).body)
  })
  it('沒有 frontmatter 就新建', () => {
    expect(setField('# hi\n', 'status', 'draft')).toBe('---\nstatus: draft\n---\n# hi\n')
  })
})

describe('normalizePunctuation', () => {
  it('轉換與 CJK 相鄰的半形標點', () => {
    expect(normalizePunctuation('測試,驗證;結論:好?對!')).toBe('測試，驗證；結論：好？對！')
  })
  it('CJK 後接半形標點再接空白也轉，且吃掉空白', () => {
    expect(normalizePunctuation('第一, 第二')).toBe('第一，第二')
  })
  it('含 CJK 的括號轉全形', () => {
    expect(normalizePunctuation('用 pytest(測試框架)跑')).toBe('用 pytest（測試框架）跑')
    expect(normalizePunctuation('測試(test)')).toBe('測試（test）')
  })
  it('純英文與數字不動', () => {
    const s = 'Hello, world: f(x) at 00:00, a;b'
    expect(normalizePunctuation(s)).toBe(s)
  })
  it('跳過 inline code、fenced code、連結網址', () => {
    const s = '中文 `a, b: 中文` 與 [連結](https://x.com/a,b) 結尾\n```\n中文,不動\n```\n'
    expect(normalizePunctuation(s)).toBe(s)
  })
  it('跳過 frontmatter', () => {
    const s = '---\ntags: [中文, 測試]\n---\n正文,結束'
    expect(normalizePunctuation(s)).toBe('---\ntags: [中文, 測試]\n---\n正文，結束')
  })
  it('冪等', () => {
    const once = normalizePunctuation('測試,驗證(說明)')
    expect(normalizePunctuation(once)).toBe(once)
  })
})

describe('validateArticle', () => {
  it('完整文章沒有錯誤', () => {
    expect(validateArticle(doc)).toEqual([])
  })
  it('缺標題與 tags 回錯誤', () => {
    const errs = validateArticle('---\nstatus: draft\n---\n正文\n')
    expect(errs).toContain('缺標題（frontmatter title 或 # 標題）')
    expect(errs).toContain('缺 tags')
  })
  it('status 值不合法', () => {
    expect(validateArticle(setField(doc, 'status', 'live'))).toContain('status 只能是 draft 或 published')
  })
})

describe('articleFields', () => {
  it('取 heading 當標題、第一段當摘要、解析 tags', () => {
    const f = articleFields(doc.replace('正文。', '這是一段超過二十個字的正文內容，用來當摘要測試用的。'))
    expect(f.title).toBe('標題')
    expect(f.tags).toEqual(['API 測試', 'pytest'])
    expect(f.excerpt).toBe('這是一段超過二十個字的正文內容，用來當摘要測試用的。')
    expect(f.content.startsWith('\n# 標題')).toBe(true)
  })
  it('frontmatter title/excerpt 優先', () => {
    const f = articleFields(setField(setField(doc, 'title', '自訂'), 'excerpt', '自訂摘要'))
    expect(f.title).toBe('自訂')
    expect(f.excerpt).toBe('自訂摘要')
  })
})

describe('articleFields tags', () => {
  it('frontmatter 沒寫 tags 就不帶 tags 欄位', () => {
    expect('tags' in articleFields('# 標題\n正文')).toBe(false)
  })
})

describe('isEditedInAdmin', () => {
  it('HTML 內容視為後台編輯過', () => {
    expect(isEditedInAdmin('<h1>標題</h1><p>x</p>')).toBe(true)
    expect(isEditedInAdmin('\n# 標題\n')).toBe(false)
    expect(isEditedInAdmin(null)).toBe(false)
  })
})
