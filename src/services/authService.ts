import { hasCloudAuth, readCloudConfig } from '../config/cloud'
import { normalizeEmailAddress, passwordLengthOk, validEmailAddress } from '../utils/accountValidation'

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: { id: string; email: string }
}

const SESSION_KEY = 'ai_friendship_auth_session'

const normalizeSession = (payload: any): AuthSession | null => {
  const token = payload?.access_token
  const user = payload?.user
  if (!token || !user?.id) return null
  return {
    accessToken: token,
    refreshToken: payload.refresh_token || '',
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    user: { id: String(user.id), email: String(user.email || '') },
  }
}

const request = async (path: string, body: unknown) => {
  const config = readCloudConfig()
  if (!hasCloudAuth(config)) throw new Error('Cloud authentication is not configured.')
  const response = await fetch(config.supabaseUrl + '/auth/v1/' + path, {
    method: 'POST',
    headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.msg || payload?.error_description || payload?.message || 'Authentication request failed.')
  return payload
}

const checkedEmail = (email: string) => {
  if (!validEmailAddress(email)) throw new Error('Enter a valid email address.')
  return normalizeEmailAddress(email)
}

export const signUp = async (email: string, password: string) => {
  if (!passwordLengthOk(password)) throw new Error('Password must be between 8 and 128 characters.')
  return normalizeSession(await request('signup', { email: checkedEmail(email), password }))
}
export const signIn = async (email: string, password: string) => {
  if (!password) throw new Error('Enter your password.')
  return normalizeSession(await request('token?grant_type=password', { email: checkedEmail(email), password }))
}
export const requestPasswordReset = async (email: string) => { await request('recover', { email: checkedEmail(email) }) }

export const saveSession = (session: AuthSession | null) => {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export const loadSession = (): AuthSession | null => {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (!value?.accessToken || !value?.user?.id) return null
    if (typeof value.expiresAt !== 'number' || (value.expiresAt <= Date.now() && !value.refreshToken)) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return value as AuthSession
  } catch { return null }
}

export const signOut = async (session: AuthSession | null) => {
  const config = readCloudConfig()
  if (session && hasCloudAuth(config)) {
    await fetch(config.supabaseUrl + '/auth/v1/logout', {
      method: 'POST',
      headers: { apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + session.accessToken },
    }).catch(() => undefined)
  }
  saveSession(null)
}


export const deleteAccount = async (session: AuthSession) => {
  const config = readCloudConfig()
  if (!hasCloudAuth(config)) throw new Error('Cloud authentication is not configured.')
  const active = await ensureFreshSession(session)
  const response = await fetch(config.supabaseUrl + '/functions/v1/delete-account', {
    method: 'DELETE',
    headers: { apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + active.accessToken },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || 'Account deletion failed.')
  saveSession(null)
}


export const refreshSession = async (session: AuthSession): Promise<AuthSession> => {
  if (!session.refreshToken) throw new Error('Your session has expired. Please sign in again.')
  const next = normalizeSession(await request('token?grant_type=refresh_token', { refresh_token: session.refreshToken }))
  if (!next) throw new Error('Unable to refresh your session.')
  if (next.user.id !== session.user.id) throw new Error('Session identity changed. Please sign in again.')
  saveSession(next)
  return next
}

export const ensureFreshSession = async (session: AuthSession): Promise<AuthSession> => {
  if (session.expiresAt - Date.now() > 60_000) return session
  const saved = loadSession()
  if (saved?.user.id === session.user.id && saved.expiresAt - Date.now() > 60_000) return saved
  return refreshSession(session)
}

export const completePasswordRecovery = async (accessToken: string, password: string) => {
  const config = readCloudConfig()
  if (!hasCloudAuth(config)) throw new Error('Cloud authentication is not configured.')
  if (password.length < 8 || password.length > 128) throw new Error('Password must be between 8 and 128 characters.')
  const response = await fetch(config.supabaseUrl + '/auth/v1/user', {
    method: 'PUT',
    headers: { apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || 'Unable to update password.')
  return true
}
