export type BillingEnv = {
  provider: 'none' | 'stripe'
  stripePublicKey: string
  stripePriceMonthly: string
  stripePriceAnnual: string
}

export const readBillingEnv = (source: Record<string, string | undefined> = import.meta.env): BillingEnv => {
  const requestedProvider = (source.VITE_BILLING_PROVIDER || 'none').toLowerCase()
  const provider: BillingEnv['provider'] = requestedProvider === 'stripe' ? 'stripe' : 'none'

  return {
    provider,
    stripePublicKey: source.VITE_STRIPE_PUBLIC_KEY || '',
    stripePriceMonthly: source.VITE_STRIPE_PRICE_PRO_MONTHLY || '',
    stripePriceAnnual: source.VITE_STRIPE_PRICE_PRO_ANNUAL || '',
  }
}
