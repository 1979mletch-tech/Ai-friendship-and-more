export type FeatureFlags = { cloudAccounts:boolean; liveAi:boolean; billing:boolean }
export const deriveFeatureFlags = (input:{cloudConfigured:boolean;chatConfigured:boolean;billingConfigured:boolean}):FeatureFlags => ({cloudAccounts:input.cloudConfigured,liveAi:input.cloudConfigured&&input.chatConfigured,billing:input.billingConfigured})
