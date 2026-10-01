import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'

const pendingKey = (session: AuthSession) => `ai_aurora_age_session:${session.user.id}`

export const isTrustedAgeVerificationUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'verify.stripe.com'
  } catch {
    return false
  }
}

const readPending = (session: AuthSession) => {
  try { return localStorage.getItem(pendingKey(session)) }
  catch { return null }
}

const writePending = (session: AuthSession, sessionId: string) => {
  try { localStorage.setItem(pendingKey(session), sessionId) }
  catch { throw new Error('This browser could not save the age-verification session. Enable site storage and try again.') }
}

const clearPending = (session: AuthSession) => {
  try { localStorage.removeItem(pendingKey(session)) } catch { /* best effort */ }
}

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
  if (typeof result.sessionId !== 'string' || !/^vs_[a-zA-Z0-9]+$/.test(result.sessionId) || !isTrustedAgeVerificationUrl(result.url)) {
    throw new Error('Invalid verification link.')
  }
  writePending(session, result.sessionId)
  return result.url as string
}

export const finishAgeVerification = async (session: AuthSession) => {
  const sessionId = readPending(session)
  if (!sessionId) throw new Error('Start age verification first.')
  const result = await callAgeService(session, { action: 'complete', sessionId })
  if (result.verified === true || result.status === 'not-eligible') clearPending(session)
  return result as { verified: boolean; status?: string }
}

export const hasPendingAgeVerification = (session: AuthSession) => Boolean(readPending(session))
