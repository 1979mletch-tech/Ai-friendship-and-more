import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'

const pendingKey = (session: AuthSession) => `ai_aurora_age_session:${session.user.id}`

const callAgeService = async (session: AuthSession, body: object) => {
  const config = readCloudConfig()
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error('Account service is not configured.')
  const active = await ensureFreshSession(session)
  const response = await fetch(`${config.supabaseUrl}/functions/v1/verify-age`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${active.accessToken}`, apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Age verification is unavailable.')
  return result
}

export const startAgeVerification = async (session: AuthSession) => {
  const result = await callAgeService(session, { action: 'start' })
  if (result.verified === true) return null
  if (typeof result.sessionId !== 'string' || !/^vs_[a-zA-Z0-9]+$/.test(result.sessionId) ||
      typeof result.url !== 'string' || !result.url.startsWith('https://')) throw new Error('Invalid verification link.')
  localStorage.setItem(pendingKey(session), result.sessionId)
  return result.url as string
}

export const finishAgeVerification = async (session: AuthSession) => {
  const sessionId = localStorage.getItem(pendingKey(session))
  if (!sessionId) throw new Error('Start age verification first.')
  const result = await callAgeService(session, { action: 'complete', sessionId })
  if (result.verified === true || result.status === 'not-eligible') localStorage.removeItem(pendingKey(session))
  return result as { verified: boolean; status?: string }
}

export const hasPendingAgeVerification = (session: AuthSession) => {
  try { return Boolean(localStorage.getItem(pendingKey(session))) } catch { return false }
}
