import { describe, expect, it } from 'vitest'
import { LIMITS, withinLimit } from './limits'

describe('central limits', () => {
  it('keeps chat input bounded', () => expect(LIMITS.chatInput).toBe(2000))
  it('checks string limits', () => expect(withinLimit('abc', 3)).toBe(true))
})
