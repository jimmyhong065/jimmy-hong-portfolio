import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useArticleSettings } from '../useArticleSettings'

describe('useArticleSettings', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to md fontSize and light mode', () => {
    const { result } = renderHook(() => useArticleSettings())
    expect(result.current.fontSize).toBe('md')
    expect(result.current.dark).toBe(false)
  })

  it('incFontSize goes md→lg and caps at lg', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.incFontSize())
    expect(result.current.fontSize).toBe('lg')
    act(() => result.current.incFontSize())
    expect(result.current.fontSize).toBe('lg')
  })

  it('decFontSize goes md→sm and caps at sm', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.decFontSize())
    expect(result.current.fontSize).toBe('sm')
    act(() => result.current.decFontSize())
    expect(result.current.fontSize).toBe('sm')
  })

  it('toggleDark flips dark state', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.toggleDark())
    expect(result.current.dark).toBe(true)
    act(() => result.current.toggleDark())
    expect(result.current.dark).toBe(false)
  })

  it('persists fontSize to localStorage', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.incFontSize())
    expect(localStorage.getItem('article-font-size')).toBe('lg')
  })

  it('persists dark to localStorage', () => {
    const { result } = renderHook(() => useArticleSettings())
    act(() => result.current.toggleDark())
    expect(localStorage.getItem('article-theme')).toBe('dark')
  })

  it('reads persisted fontSize on init', () => {
    localStorage.setItem('article-font-size', 'sm')
    const { result } = renderHook(() => useArticleSettings())
    expect(result.current.fontSize).toBe('sm')
  })

  it('reads persisted dark on init', () => {
    localStorage.setItem('article-theme', 'dark')
    const { result } = renderHook(() => useArticleSettings())
    expect(result.current.dark).toBe(true)
  })

  it('ignores invalid localStorage value for fontSize', () => {
    localStorage.setItem('article-font-size', 'xxl')
    const { result } = renderHook(() => useArticleSettings())
    expect(result.current.fontSize).toBe('md')
  })
})
