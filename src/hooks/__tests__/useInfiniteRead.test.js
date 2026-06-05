import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useInfiniteRead } from '../useInfiniteRead'

// Mutable store controlled per-test
const db = { posts: [] }

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: db.posts }),
      }),
    }),
  },
}))

describe('useInfiniteRead', () => {
  beforeEach(() => { db.posts = [] })

  it('returns null immediately when initialTags is empty', async () => {
    const { result } = renderHook(() => useInfiniteRead([], 'current-slug'))
    const next = await result.current.fetchNext()
    expect(next).toBeNull()
  })

  it('returns highest-scoring related post', async () => {
    db.posts = [
      { slug: 'post-a', tags: ['QA'], published: true },
      { slug: 'post-b', tags: ['QA', '自動化'], published: true },
    ]
    const { result } = renderHook(() => useInfiniteRead(['QA', '自動化'], 'current-slug'))
    const next = await result.current.fetchNext()
    expect(next?.slug).toBe('post-b')
  })

  it('excludes initialSlug from results', async () => {
    db.posts = [
      { slug: 'current-slug', tags: ['QA'], published: true },
      { slug: 'other', tags: ['QA'], published: true },
    ]
    const { result } = renderHook(() => useInfiniteRead(['QA'], 'current-slug'))
    const next = await result.current.fetchNext()
    expect(next?.slug).toBe('other')
  })

  it('excludes previously fetched slugs on subsequent calls', async () => {
    db.posts = [
      { slug: 'post-a', tags: ['QA', '自動化'], published: true },
      { slug: 'post-b', tags: ['QA'], published: true },
    ]
    const { result } = renderHook(() => useInfiniteRead(['QA', '自動化'], 'current'))
    const first = await result.current.fetchNext()
    expect(first?.slug).toBe('post-a')
    const second = await result.current.fetchNext()
    expect(second?.slug).toBe('post-b')
  })

  it('returns null when no more unseen related posts', async () => {
    db.posts = [{ slug: 'post-a', tags: ['QA'], published: true }]
    const { result } = renderHook(() => useInfiniteRead(['QA'], 'current'))
    await result.current.fetchNext()         // consumes post-a
    const next = await result.current.fetchNext()
    expect(next).toBeNull()
  })

  it('returns null when no post has tag overlap', async () => {
    db.posts = [{ slug: 'post-a', tags: ['無關'], published: true }]
    const { result } = renderHook(() => useInfiniteRead(['QA'], 'current'))
    const next = await result.current.fetchNext()
    expect(next).toBeNull()
  })
})
