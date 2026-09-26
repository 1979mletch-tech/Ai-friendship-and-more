import { describe, expect, it } from 'vitest'
import { companionContext, sanitizeCompanionProfile } from './companionProfile'

describe('companion profile', () => {
  it('uses a safe default name and bounded interests', () => {
    const value = sanitizeCompanionProfile({ name: '   ', tone: 'warm', interests: 'x'.repeat(500) })
    expect(value.name).toBe('Friend')
    expect(value.interests).toHaveLength(300)
  })
  it('creates explicit user-approved context', () => {
    expect(companionContext({ name: 'Nova', tone: 'calm', interests: 'books' })).toContain('User-approved interests: books')
  })
})
