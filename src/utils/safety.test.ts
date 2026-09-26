import { describe, expect, it } from 'vitest'
import { disclosureText, emergencyNotice, isCrisisText } from './safety'

describe('safety helper', () => {
  it('detects obvious emergency or self-harm language', () => {
    expect(isCrisisText('I have severe chest pain and cannot breathe')).toBe(true)
    expect(isCrisisText('I want to die tonight')).toBe(true)
    expect(isCrisisText('My ankle hurts after running')).toBe(false)
  })

  it('keeps healthcare limits explicit', () => {
    expect(disclosureText).toMatch(/not a doctor/i)
    expect(disclosureText).toMatch(/not an emergency service/i)
    expect(emergencyNotice).toMatch(/medical emergency/i)
  })
})
