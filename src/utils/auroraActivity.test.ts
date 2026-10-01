import { describe, expect, it } from 'vitest'
import { getAuroraDaypart, inferAuroraScene } from './auroraActivity'

describe('Aurora activity intelligence', () => {
  it('detects explicit shared activities', () => {
    expect(inferAuroraScene('Come for a walk with me')).toBe('walk')
    expect(inferAuroraScene('I want to do some stretching')).toBe('exercise')
    expect(inferAuroraScene('Can we just relax on the sofa?')).toBe('relax')
    expect(inferAuroraScene('Good night, I am going to bed')).toBe('sleep')
  })

  it('does not force a scene for ordinary conversation', () => {
    expect(inferAuroraScene('Tell me about my project idea')).toBeNull()
  })

  it('maps local time to a daypart without using location', () => {
    expect(getAuroraDaypart(new Date('2026-10-01T08:00:00'))).toBe('morning')
    expect(getAuroraDaypart(new Date('2026-10-01T14:00:00'))).toBe('day')
    expect(getAuroraDaypart(new Date('2026-10-01T19:30:00'))).toBe('evening')
    expect(getAuroraDaypart(new Date('2026-10-01T23:30:00'))).toBe('night')
  })
})
