export type BillingEnv = {
  provider: string
  stripePublicKey: string
  stripePriceMonthly: string
  stripePriceAnnual: string
}

export const readBillingEnv = (source: Record<string, string | undefined> = import.meta.env): BillingEnv => ({
  provider: (source.VITE_BILLING_PROVIDER || 'none').toLowerCase(),
  stripePublicKey: source.VITE_STRIPE_PUBLIC_KEY || '',
  stripePriceMonthly: source.VITE_STRIPE_PRICE_PRO_MONTHLY || '',
  stripePriceAnnual: source.VITE_STRIPE_PRICE_PRO_ANNUAL || '',
})
