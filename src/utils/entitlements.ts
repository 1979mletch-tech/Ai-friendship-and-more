import type { Entitlements, Plan, PlanId } from '../types/subscription'

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    priceLabel: '£0',
    proposed: false,
    features: [
      'Symptom guidance and safety escalation',
      'Healthcare visit summaries',
      'Basic conversation history on this device',
      'Privacy and data controls included',
    ],
  },
  {
    id: 'pro-monthly',
    name: 'Plus Monthly',
    priceLabel: '£9.99/month (proposed)',
    proposed: true,
    features: [
      'Higher daily consultation limit',
      'Longer visit summary history',
      'Priority product updates during controlled launch',
      'Expanded personalised onboarding preferences',
    ],
  },
  {
    id: 'pro-annual',
    name: 'Plus Annual',
    priceLabel: '£95/year (proposed)',
    proposed: true,
    features: [
      'Everything in Plus Monthly',
      'Annual pricing discount',
      'Longer on-device history allowance',
      'Priority access to future integrated care features',
    ],
  },
]

export const getEntitlements = (planId: PlanId): Entitlements => {
  if (planId === 'free') {
    return {
      planId,
      canUseCreativePrompts: false,
      canUseProjectMemory: false,
      canUseLongHistory: false,
      canUseAdvancedPersonalization: false,
      usageLimits: {
        dailyMessages: 10,
        basicHistoryDays: 30,
        projectNotesLimit: 5,
      },
    }
  }

  return {
    planId,
    canUseCreativePrompts: false,
    canUseProjectMemory: false,
    canUseLongHistory: true,
    canUseAdvancedPersonalization: true,
    usageLimits: {
      dailyMessages: 50,
      basicHistoryDays: 365,
      projectNotesLimit: 100,
    },
  }
}

export const isProPlan = (planId: PlanId): boolean => planId !== 'free'

export const applyProjectNotesLimit = <T>(notes: T[], planId: PlanId): T[] =>
  notes.slice(0, getEntitlements(planId).usageLimits.projectNotesLimit)
