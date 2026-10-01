import { describe, expect, it } from 'vitest'
import { isTrustedBillingUrl } from './billingService'

describe('billing redirect safety', () => {
  it('allows Stripe Checkout and Billing Portal HTTPS URLs', () => {
    expect(isTrustedBillingUrl('https://checkout.stripe.com/c/pay/example')).toBe(true)
    expect(isTrustedBillingUrl('https://billing.stripe.com/p/session/example')).toBe(true)
  })

  it('rejects lookalike, non-HTTPS, credential-bearing and malformed billing URLs', () => {
    expect(isTrustedBillingUrl('https://checkout.stripe.com.evil.example/session')).toBe(false)
    expect(isTrustedBillingUrl('http://checkout.stripe.com/session')).toBe(false)
    expect(isTrustedBillingUrl('javascript:alert(1)')).toBe(false)
    expect(isTrustedBillingUrl('https://attacker:secret@checkout.stripe.com/session')).toBe(false)
    expect(isTrustedBillingUrl(undefined)).toBe(false)
  })
})
