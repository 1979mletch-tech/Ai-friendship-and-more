import { describe, expect, it } from 'vitest'
import { isTrustedAgeVerificationUrl } from './ageVerificationService'

describe('age verification redirect safety', () => {
  it('allows Stripe Identity HTTPS links', () => {
    expect(isTrustedAgeVerificationUrl('https://verify.stripe.com/start/example')).toBe(true)
  })

  it('rejects lookalike, non-HTTPS and malformed verification links', () => {
    expect(isTrustedAgeVerificationUrl('https://verify.stripe.com.evil.example/start')).toBe(false)
    expect(isTrustedAgeVerificationUrl('http://verify.stripe.com/start/example')).toBe(false)
    expect(isTrustedAgeVerificationUrl('https://user:pass@verify.stripe.com/start/example')).toBe(false)
    expect(isTrustedAgeVerificationUrl('javascript:alert(1)')).toBe(false)
    expect(isTrustedAgeVerificationUrl(null)).toBe(false)
  })
})
