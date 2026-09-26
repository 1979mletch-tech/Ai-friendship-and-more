import { describe, expect, it } from 'vitest'
import { sanitizePreferences } from './preferences'

describe('companion preferences', () => {
  it('sanitizes untrusted preference input', () => {
    expect(sanitizePreferences({ tone: 'direct', interests: '<music>' })).toEqual({
      tone: 'direct', interests: 'music', memoryEnabled: true,
    })
  })
  it('falls back from invalid tone values', () => {
    expect(sanitizePreferences({ tone: 'evil' as never }).tone).toBe('warm')
  })
})
