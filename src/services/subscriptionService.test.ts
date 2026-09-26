import { describe, expect, it } from 'vitest'
import { getSubscriptionState } from './subscriptionService'

describe('subscription service', () => {
  it('returns preview state when provider missing', () => {
    const state = getSubscriptionState({
      provider: 'none',
    })

    expect(state.provider).toBe('none')
    expect(state.isConfigured).toBe(false)
  })

  it('does not infer a paid subscription from public browser settings', () => {
    const state = getSubscriptionState({
      provider: 'stripe',
    })

    expect(state.provider).toBe('stripe')
    expect(state.isConfigured).toBe(false)
    expect(state.setupMessage).toMatch(/preview/i)
  })
})
