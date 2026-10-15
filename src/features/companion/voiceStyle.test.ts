import { describe, expect, it } from 'vitest'
import { getVoiceStyle, isDistressCue } from './voiceStyle'

describe('Aurora expressive voice', () => {
  it('uses bright delivery by default', () => expect(getVoiceStyle(false, false).mode).toBe('bright'))
  it('respects quiet mode', () => expect(getVoiceStyle(true, false).mode).toBe('gentle'))
  it('does not force bubbly speech during distress', () => expect(getVoiceStyle(false, true).mode).toBe('gentle'))
  it('recognizes some distress cues', () => {
    expect(isDistressCue('I feel hopeless')).toBe(true)
    expect(isDistressCue('Nice day by the lake')).toBe(false)
  })
})
