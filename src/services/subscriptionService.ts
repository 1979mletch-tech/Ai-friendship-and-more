import { readBillingEnv, type BillingEnv } from '../config/env'
import type { SubscriptionState } from '../types/subscription'

export const getSubscriptionState = (env: BillingEnv = readBillingEnv()): SubscriptionState => {
  if (env.provider === 'stripe') {
    const isConfigured = Boolean(env.stripePublicKey && env.stripePriceMonthly && env.stripePriceAnnual)

    return {
      provider: 'stripe',
      isConfigured,
      setupMessage: isConfigured
        ? 'Billing provider configured. Connect checkout + webhooks server-side before production launch.'
        : 'Stripe selected but missing one or more keys/price IDs. Showing subscription preview only.',
    }
  }

  return {
    provider: 'none',
    isConfigured: false,
    setupMessage:
      'Billing provider not configured. Pricing is shown as a safe preview state with no real payments.',
  }
}
