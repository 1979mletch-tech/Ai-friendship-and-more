import { describe, expect, it } from 'vitest'
import { safeReturnPath } from './navigation'

describe('safe return paths', () => {
  it('allows internal hash routes', () => expect(safeReturnPath('#/chat')).toBe('#/chat'))
  it('rejects external and malformed routes', () => {
    expect(safeReturnPath('https://evil.example')).toBe('#/')
    expect(safeReturnPath('#/https://evil.example')).toBe('#/')
    expect(safeReturnPath(null)).toBe('#/')
  })
})
