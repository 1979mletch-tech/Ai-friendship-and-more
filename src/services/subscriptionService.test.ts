import { describe, expect, it } from 'vitest'
import { getSubscriptionState } from './subscriptionService'

describe('subscription service', () => {
  it('returns preview state when provider missing', () => {
    const state = getSubscriptionState({
      provider: 'none',
      stripePublicKey: '',
      stripePriceMonthly: '',
      stripePriceAnnual: '',
    })

    expect(state.provider).toBe('none')
    expect(state.isConfigured).toBe(false)
  })

  it('returns setup warning when stripe keys are incomplete', () => {
    const state = getSubscriptionState({
      provider: 'stripe',
      stripePublicKey: 'pk_test_123',
      stripePriceMonthly: '',
      stripePriceAnnual: '',
    })

    expect(state.provider).toBe('stripe')
    expect(state.isConfigured).toBe(false)
    expect(state.setupMessage).toMatch(/preview/i)
  })
})
