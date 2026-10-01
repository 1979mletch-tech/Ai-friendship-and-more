import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'
import type { PlanId } from '../types/subscription'

const TRUSTED_BILLING_HOSTS = new Set(['checkout.stripe.com', 'billing.stripe.com'])
const paidPlans = new Set<PlanId>(['pro-daily', 'pro-weekly', 'pro-monthly', 'pro-annual'])
const paidStatuses = new Set(['active', 'trialing'])

export type BillingStatus = {
  plan: PlanId
  status: string
  paid: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
}

export const isTrustedBillingUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && TRUSTED_BILLING_HOSTS.has(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

const request = async (session: AuthSession, action: string, plan?: PlanId) => {
  const config = readCloudConfig()
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error('Account service is not configured.')
  const active = await ensureFreshSession(session)
  const response = await fetch(`${config.supabaseUrl}/functions/v1/billing`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${active.accessToken}`, apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, plan }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Billing is unavailable.')
  return result
}

export const getBillingStatus = async (session: AuthSession): Promise<BillingStatus> => {
  const result = await request(session, 'status')
  const status = typeof result.status === 'string' ? result.status : 'none'
  const plan = paidPlans.has(result.plan as PlanId) && paidStatuses.has(status) ? result.plan as PlanId : 'free'
  return {
    plan,
    status,
    paid: plan !== 'free',
    cancelAtPeriodEnd: result.cancelAtPeriodEnd === true,
    currentPeriodEnd: typeof result.currentPeriodEnd === 'string' ? result.currentPeriodEnd : null,
  }
}

export const getBillingPlan = async (session: AuthSession): Promise<PlanId> =>
  (await getBillingStatus(session)).plan

export const openBilling = async (session: AuthSession, action: 'checkout' | 'portal', plan?: PlanId) => {
  if (action === 'checkout' && (!plan || !paidPlans.has(plan))) throw new Error('Choose a valid paid plan.')
  const result = await request(session, action, plan)
  if (!isTrustedBillingUrl(result.url)) throw new Error('Invalid billing link.')
  window.location.assign(result.url)
}
