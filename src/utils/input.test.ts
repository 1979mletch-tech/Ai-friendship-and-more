import { describe, expect, it } from 'vitest'
import { isReasonableEmail, normalizeDisplayName, normalizeUserText } from './input'

describe('input helpers', () => {
  it('bounds and trims chat text', () => {
    expect(normalizeUserText('  hi  ')).toBe('hi')
    expect(normalizeUserText('x'.repeat(3000))).toHaveLength(2000)
  })
  it('sanitizes display names', () => {
    expect(normalizeDisplayName(' <Nova> ')).toBe('Nova')
    expect(normalizeDisplayName('   ')).toBe('Friend')
  })
  it('performs basic client email checks', () => {
    expect(isReasonableEmail('user@example.test')).toBe(true)
    expect(isReasonableEmail('not-an-email')).toBe(false)
  })
})
