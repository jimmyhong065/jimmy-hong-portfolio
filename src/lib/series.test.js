import { describe, it, expect } from 'vitest'
import { summarizeSeries, pickSeriesForTags } from './series'

const courses = [
  { id: 'c1', slug: 'course-bughunt', title: '抓蟲', display_order: 7 },
  { id: 'c2', slug: 'course-api', title: 'API', display_order: 3 },
  { id: 'c3', slug: 'course-empty', title: '空', display_order: 1 },
]
const chapters = [
  { course_id: 'c1', tags: ['缺陷報告', 'QA 實戰'] },
  { course_id: 'c1', tags: ['偶發缺陷', 'QA 實戰'] },
  { course_id: 'c2', tags: ['API 測試'] },
]

describe('summarizeSeries', () => {
  it('counts published chapters and collects tags, keeping course order', () => {
    const series = summarizeSeries(courses, chapters)
    expect(series.map(s => s.slug)).toEqual(['course-bughunt', 'course-api'])
    expect(series[0].chapterCount).toBe(2)
    expect([...series[0].tags].sort()).toEqual(['QA 實戰', '偶發缺陷', '缺陷報告'])
  })

  it('drops series with no published chapters', () => {
    expect(summarizeSeries(courses, chapters).some(s => s.slug === 'course-empty')).toBe(false)
  })

  it('handles missing input', () => {
    expect(summarizeSeries(null, null)).toEqual([])
  })
})

describe('pickSeriesForTags', () => {
  const series = summarizeSeries(courses, chapters)

  it('ranks series by tag overlap', () => {
    expect(pickSeriesForTags(series, ['QA 實戰', '缺陷報告', 'API 測試']).map(s => s.slug))
      .toEqual(['course-bughunt', 'course-api'])
  })

  it('matches tags case-insensitively', () => {
    const s2 = summarizeSeries([courses[0]], [{ course_id: 'c1', tags: ['bug report'] }])
    expect(pickSeriesForTags(s2, ['Bug Report'])).toHaveLength(1)
  })

  it('respects the limit', () => {
    expect(pickSeriesForTags(series, ['QA 實戰', 'API 測試'], 1)).toHaveLength(1)
  })

  it('returns nothing when no tag overlaps', () => {
    expect(pickSeriesForTags(series, ['攝影'])).toEqual([])
    expect(pickSeriesForTags(series, undefined)).toEqual([])
  })
})
