import type { PlanId } from '../types/subscription'
export const isPaidPlan = (plan: PlanId) => plan === 'pro-monthly' || plan === 'pro-annual'
export const checkoutUnavailableCopy = (plan: PlanId) => isPaidPlan(plan) ? 'Checkout is not enabled on this preview. No payment has been taken.' : ''
