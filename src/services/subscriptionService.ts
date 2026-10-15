import { readBillingEnv, type BillingEnv } from '../config/env'
import type { SubscriptionState } from '../types/subscription'

export const getSubscriptionState = (env: BillingEnv = readBillingEnv()): SubscriptionState => {
  if (env.provider === 'stripe') {
    const isConfigured = Boolean(
      env.stripePriceDaily &&
      env.stripePriceWeekly &&
      env.stripePriceMonthly &&
      env.stripePriceAnnual,
    )

    return {
      provider: 'stripe',
      isConfigured,
      setupMessage: isConfigured
        ? 'Secure Stripe Checkout is configured. Adult verification is required before purchase.'
        : 'Stripe is selected but one or more price IDs are missing. Payments stay disabled.',
    }
  }

  return {
    provider: 'none',
    isConfigured: false,
    setupMessage: 'Payments are currently disabled.',
  }
}
