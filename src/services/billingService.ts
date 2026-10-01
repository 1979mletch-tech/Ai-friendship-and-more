import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'
import type { PlanId } from '../types/subscription'

const TRUSTED_BILLING_HOSTS = new Set(['checkout.stripe.com', 'billing.stripe.com'])
const paidPlans = new Set<PlanId>(['pro-daily', 'pro-weekly', 'pro-monthly', 'pro-annual'])

export const isTrustedBillingUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && TRUSTED_BILLING_HOSTS.has(url.hostname.toLowerCase())
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

export const getBillingPlan = async (session: AuthSession): Promise<PlanId> => {
  const result = await request(session, 'status')
  return paidPlans.has(result.plan as PlanId) ? result.plan as PlanId : 'free'
}

export const openBilling = async (session: AuthSession, action: 'checkout' | 'portal', plan?: PlanId) => {
  const result = await request(session, action, plan)
  if (!isTrustedBillingUrl(result.url)) throw new Error('Invalid billing link.')
  window.location.assign(result.url)
}
