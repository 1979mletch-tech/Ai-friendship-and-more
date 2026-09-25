import { describe, expect, it } from 'vitest'
import { disclosureText, isCrisisText } from './safety'

describe('safety helper', () => {
  it('detects immediate-risk language', () => {
    expect(isCrisisText('I want to die tonight')).toBe(true)
    expect(isCrisisText('Can you help me write a poem?')).toBe(false)
  })

  it('keeps non-therapy disclosure explicit', () => {
    expect(disclosureText).toMatch(/not a therapist/i)
    expect(disclosureText).toMatch(/not an emergency service/i)
  })
})
