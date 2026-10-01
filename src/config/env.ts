export type BillingEnv = {
  provider: 'none' | 'stripe'
  stripePriceDaily: string
  stripePriceWeekly: string
  stripePriceMonthly: string
  stripePriceAnnual: string
}

export const readBillingEnv = (source: Record<string, string | undefined> = import.meta.env): BillingEnv => {
  const requestedProvider = (source.VITE_BILLING_PROVIDER || 'none').toLowerCase()
  const provider: BillingEnv['provider'] = requestedProvider === 'stripe' ? 'stripe' : 'none'

  return {
    provider,
    stripePriceDaily: source.VITE_STRIPE_PRICE_PRO_DAILY || '',
    stripePriceWeekly: source.VITE_STRIPE_PRICE_PRO_WEEKLY || '',
    stripePriceMonthly: source.VITE_STRIPE_PRICE_PRO_MONTHLY || '',
    stripePriceAnnual: source.VITE_STRIPE_PRICE_PRO_ANNUAL || '',
  }
}
