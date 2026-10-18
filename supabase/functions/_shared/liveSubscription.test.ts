import { describe, expect, it } from 'vitest'
import { liveCustomerSubscription, livePaidSubscription, type StoredSubscription } from './liveSubscription'

const subscription = (livemode: boolean, status: string): StoredSubscription => ({
  livemode, status, plan: 'pro-monthly', stripe_customer_id: 'cus_example',
})

describe('live billing boundary', () => {
  it('never grants Pro or reuses the customer ID from an active test subscription', () => {
    const test = subscription(false, 'active')
    expect(livePaidSubscription(test)).toBe(false)
    expect(liveCustomerSubscription(test)).toBeNull()
  })
  it('grants only active or trialing live subscriptions', () => {
    expect(livePaidSubscription(subscription(true, 'active'))).toBe(true)
    expect(livePaidSubscription(subscription(true, 'trialing'))).toBe(true)
    expect(livePaidSubscription(subscription(true, 'past_due'))).toBe(false)
    expect(livePaidSubscription(null)).toBe(false)
  })
})
