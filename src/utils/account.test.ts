import { describe, expect, it } from 'vitest'
import { normalizeEmail, passwordMeetsClientMinimum } from './account'

describe('account helpers', () => {
  it('normalizes email', () => expect(normalizeEmail(' User@Example.Test ')).toBe('user@example.test'))
  it('enforces client password bounds', () => {
    expect(passwordMeetsClientMinimum('short')).toBe(false)
    expect(passwordMeetsClientMinimum('long-enough')).toBe(true)
  })
})
