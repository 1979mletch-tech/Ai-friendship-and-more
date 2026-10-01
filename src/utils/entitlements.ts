import type { Entitlements, Plan, PlanId } from '../types/subscription'

const paidFeatures = [
  'Up to 250 AI messages/day',
  'Expanded project memory and tags',
  'Longer conversation history',
  'Aurora generated voice access',
]

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Try Aurora',
    priceLabel: 'First 10 messages free',
    proposed: false,
    features: [
      'First 10 AI messages free',
      'Basic memory and conversation history',
      'General and creative topic starters',
      'Safety and privacy controls included',
    ],
  },
  {
    id: 'pro-daily',
    name: 'Aurora Daily',
    priceLabel: '£4 / day',
    proposed: false,
    features: paidFeatures,
  },
  {
    id: 'pro-weekly',
    name: 'Aurora Weekly',
    priceLabel: '£12 / week',
    proposed: false,
    features: paidFeatures,
  },
  {
    id: 'pro-monthly',
    name: 'Aurora Monthly',
    priceLabel: '£20 / month',
    proposed: false,
    features: paidFeatures,
  },
  {
    id: 'pro-annual',
    name: 'Aurora Annual',
    priceLabel: '£90 / year',
    proposed: false,
    features: [...paidFeatures, 'Annual access'],
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
        dailyMessages: 10,
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

export const applyProjectNotesLimit = <T>(notes: T[], planId: PlanId): T[] =>
  notes.slice(0, getEntitlements(planId).usageLimits.projectNotesLimit)
