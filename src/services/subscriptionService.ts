import { readBillingEnv, type BillingEnv } from '../config/env'
import type { SubscriptionState } from '../types/subscription'

export const getSubscriptionState = (env: BillingEnv = readBillingEnv()): SubscriptionState => {
  if (env.provider === 'stripe') {
    return {
      provider: 'stripe',
      isConfigured: false,
      setupMessage: 'Stripe checkout is available only after the cloud billing functions, prices and webhook are deployed and tested. Pricing is a preview until then.',
    }
  }

  return {
    provider: 'none',
    isConfigured: false,
    setupMessage:
      'Billing provider not configured. Pricing is shown as a safe preview state with no real payments.',
  }
}
