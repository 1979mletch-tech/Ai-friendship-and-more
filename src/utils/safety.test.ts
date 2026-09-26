import { describe, expect, it } from 'vitest'
import { crisisGuidance, disclosureText, isCrisisText } from './safety'

describe('safety helper', () => {
  it('detects immediate-risk language', () => {
    expect(isCrisisText('I want to die tonight')).toBe(true)
    expect(isCrisisText('I might hurt myself')).toBe(true)
    expect(isCrisisText('I cannot keep myself safe')).toBe(true)
    expect(isCrisisText('I have taken an overdose')).toBe(true)
    expect(isCrisisText('I am feeling suicidal')).toBe(true)
    expect(isCrisisText("I can't keep myself safe")).toBe(true)
    expect(isCrisisText('Can you help me write a poem?')).toBe(false)
  })

  it('keeps non-therapy disclosure explicit', () => {
    expect(disclosureText).toMatch(/not a therapist/i)
    expect(disclosureText).toMatch(/not an emergency service/i)
    expect(crisisGuidance).toMatch(/999 or 112/)
    expect(crisisGuidance).toMatch(/no immediate danger/)
  })
})
