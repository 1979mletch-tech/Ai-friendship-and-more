export type BillingEnv = {
  provider: 'none' | 'stripe'
}

export const readBillingEnv = (source: Record<string, string | undefined> = import.meta.env): BillingEnv => {
  const requestedProvider = (source.VITE_BILLING_PROVIDER || 'none').toLowerCase()
  const provider: BillingEnv['provider'] = requestedProvider === 'stripe' ? 'stripe' : 'none'

  return {
    provider,
  }
}
