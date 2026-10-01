import { describe, expect, it } from 'vitest'
import { getSubscriptionState } from './subscriptionService'

describe('subscription service', () => {
  it('returns disabled state when provider missing', () => {
    const state = getSubscriptionState({
      provider: 'none',
      stripePriceDaily: '',
      stripePriceWeekly: '',
      stripePriceMonthly: '',
      stripePriceAnnual: '',
    })

    expect(state.provider).toBe('none')
    expect(state.isConfigured).toBe(false)
  })

  it('keeps payments disabled when a Stripe price is missing', () => {
    const state = getSubscriptionState({
      provider: 'stripe',
      stripePriceDaily: 'price_daily',
      stripePriceWeekly: 'price_weekly',
      stripePriceMonthly: 'price_monthly',
      stripePriceAnnual: '',
    })

    expect(state.provider).toBe('stripe')
    expect(state.isConfigured).toBe(false)
  })

  it('enables billing when all four plan prices are present', () => {
    const state = getSubscriptionState({
      provider: 'stripe',
      stripePriceDaily: 'price_daily',
      stripePriceWeekly: 'price_weekly',
      stripePriceMonthly: 'price_monthly',
      stripePriceAnnual: 'price_annual',
    })

    expect(state.provider).toBe('stripe')
    expect(state.isConfigured).toBe(true)
  })
})
