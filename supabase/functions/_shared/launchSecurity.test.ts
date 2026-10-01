import { describe, expect, it } from 'vitest'
import { isAdultDob } from './adultDob'
import { validStripeSignature } from './stripeSignature'

describe('adult verification boundary', () => {
  const today = new Date('2026-09-27T13:00:00Z')
  it('accepts an exact 18th birthday and rejects someone a day younger', () => {
    expect(isAdultDob({ year: 2008, month: 9, day: 27 }, today)).toBe(true)
    expect(isAdultDob({ year: 2008, month: 9, day: 28 }, today)).toBe(false)
  })
  it('rejects malformed dates and absent verified DOB', () => {
    expect(isAdultDob({ year: 2000, month: 2, day: 30 }, today)).toBe(false)
    expect(isAdultDob(null, today)).toBe(false)
  })
})

describe('Stripe webhook signature', () => {
  it('accepts authentic raw payload and rejects tampering and replay', async () => {
    const payload = '{"type":"customer.subscription.updated"}'
    const timestamp = '1700000000'
    const secret = 'whsec_test'
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`)))
    const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
    const signature = `t=${timestamp},v1=${hex}`
    expect(await validStripeSignature(payload, signature, secret, 1700000000000)).toBe(true)
    expect(await validStripeSignature(payload + ' ', signature, secret, 1700000000000)).toBe(false)
    expect(await validStripeSignature(payload, signature, secret, 1700001000000)).toBe(false)
  })
})
