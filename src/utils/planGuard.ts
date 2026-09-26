import type { PlanId } from '../types/subscription'
export const normalizePlan=(value:unknown):PlanId => value==='pro-monthly'||value==='pro-annual' ? value : 'free'
export const trustedEntitlementRequired=(plan:PlanId)=>plan!=='free'
export const previewPlanWarning=(plan:PlanId)=>trustedEntitlementRequired(plan)?'Preview selection only. Paid access must be verified server-side before launch.':''
