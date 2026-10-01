import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'
import type { PlanId } from '../types/subscription'

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
  return result.plan === 'pro-monthly' || result.plan === 'pro-annual' ? result.plan : 'free'
}

export const openBilling = async (session: AuthSession, action: 'checkout' | 'portal', plan?: PlanId) => {
  const result = await request(session, action, plan)
  if (typeof result.url !== 'string' || !result.url.startsWith('https://')) throw new Error('Invalid billing link.')
  window.location.assign(result.url)
}
