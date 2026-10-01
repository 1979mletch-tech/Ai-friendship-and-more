import { describe, expect, it } from 'vitest'
import { inferAuroraReaction } from './auroraReaction'

describe('Aurora reaction cues', () => {
  it('recognizes clear conversational cues', () => {
    expect(inferAuroraReaction('Great news, I passed!')).toBe('celebrate')
    expect(inferAuroraReaction('I am stuck and need a push')).toBe('encourage')
    expect(inferAuroraReaction('I want to wind down before bed')).toBe('calm')
    expect(inferAuroraReaction('Help me plan the next step')).toBe('focus')
  })

  it('stays neutral for ordinary conversation', () => {
    expect(inferAuroraReaction('Tell me something interesting')).toBe('neutral')
  })
})
