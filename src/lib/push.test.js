import { describe, it, expect } from 'vitest'

function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
function base64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(s), c => c.charCodeAt(0))
}

describe('base64url helpers', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255])
    expect(base64urlDecode(base64urlEncode(bytes))).toEqual(bytes)
  })

  it('encodes with no padding chars', () => {
    const encoded = base64urlEncode(new Uint8Array([1, 2, 3]))
    expect(encoded).not.toContain('=')
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
  })
})
