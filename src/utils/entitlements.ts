import type { Entitlements, Plan, PlanId } from '../types/subscription'

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free Friend',
    priceLabel: '$0',
    proposed: false,
    features: [
      'Up to 25 messages/day',
      'Basic memory and conversation history',
      'General + creative topic starters',
      'Safety, privacy controls, and crisis guidance included',
    ],
  },
  {
    id: 'pro-monthly',
    name: 'Studio Friend Pro',
    priceLabel: '$9.99/month (proposed)',
    proposed: true,
    features: [
      'Higher daily usage cap',
      'Richer creative project memory and tags',
      'Longer history and project continuity',
      'Deeper personalization and creative prompts',
    ],
  },
  {
    id: 'pro-annual',
    name: 'Studio Friend Annual',
    priceLabel: '$79/year (proposed)',
    proposed: true,
    features: [
      'Everything in Pro monthly',
      'Annual pricing discount',
      'Creative weekly reviews and idea sparks',
      'Priority for future immersive upgrades',
    ],
  },
]

export const getEntitlements = (planId: PlanId): Entitlements => {
  if (planId === 'free') {
    return {
      planId,
      canUseCreativePrompts: true,
      canUseProjectMemory: true,
      canUseLongHistory: false,
      canUseAdvancedPersonalization: false,
      usageLimits: {
        dailyMessages: 25,
        basicHistoryDays: 7,
        projectNotesLimit: 3,
      },
    }
  }

  return {
    planId,
    canUseCreativePrompts: true,
    canUseProjectMemory: true,
    canUseLongHistory: true,
    canUseAdvancedPersonalization: true,
    usageLimits: {
      dailyMessages: 250,
      basicHistoryDays: 365,
      projectNotesLimit: 100,
    },
  }
}

export const isProPlan = (planId: PlanId): boolean => planId !== 'free'
