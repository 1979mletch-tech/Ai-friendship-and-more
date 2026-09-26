import { describe, expect, it } from 'vitest'
import { classifySafetyText, disclosureText, isCrisisText, safetyResponse } from './safety'

describe('safety helper', () => {
  it('detects immediate-risk language without treating ordinary chat as crisis', () => {
    expect(isCrisisText('I want to die tonight')).toBe(true)
    expect(isCrisisText('I plan to kill myself')).toBe(true)
    expect(isCrisisText('Can you help me write a poem?')).toBe(false)
    expect(isCrisisText('This project is killing me')).toBe(false)
  })
  it('sets healthy dependency boundaries', () => {
    expect(classifySafetyText("You're the only friend I need")).toBe('dependency')
    expect(safetyResponse('dependency')).toMatch(/should not replace people/i)
  })
  it('keeps the product platonic', () => {
    expect(classifySafetyText('Can we do erotic roleplay?')).toBe('sexual')
    expect(safetyResponse('sexual')).toMatch(/platonic/i)
  })
  it('keeps AI identity and limits explicit', () => {
    expect(disclosureText).toMatch(/AI companion/i)
    expect(disclosureText).toMatch(/not a human/i)
    expect(disclosureText).toMatch(/not a therapist/i)
    expect(disclosureText).toMatch(/not an emergency service/i)
  })
})
