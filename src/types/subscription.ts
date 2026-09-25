export type PlanId = 'free' | 'pro-monthly' | 'pro-annual'

export type SubscriptionProvider = 'stripe' | 'none'

export type Plan = {
  id: PlanId
  name: string
  priceLabel: string
  proposed: boolean
  features: string[]
}

export type UsageLimits = {
  dailyMessages: number
  basicHistoryDays: number
  projectNotesLimit: number
}

export type Entitlements = {
  planId: PlanId
  canUseCreativePrompts: boolean
  canUseProjectMemory: boolean
  canUseLongHistory: boolean
  canUseAdvancedPersonalization: boolean
  usageLimits: UsageLimits
}

export type SubscriptionState = {
  provider: SubscriptionProvider
  isConfigured: boolean
  setupMessage: string
}
