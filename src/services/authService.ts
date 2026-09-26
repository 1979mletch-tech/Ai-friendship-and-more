import { hasCloudAuth, readCloudConfig } from '../config/cloud'

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

export const signUp = async (email: string, password: string) => normalizeSession(await request('signup', { email, password }))
export const signIn = async (email: string, password: string) => normalizeSession(await request('token?grant_type=password', { email, password }))
export const requestPasswordReset = async (email: string) => { await request('recover', { email }) }

export const saveSession = (session: AuthSession | null) => {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export const loadSession = (): AuthSession | null => {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (!value?.accessToken || !value?.user?.id) return null
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
  const response = await fetch(config.supabaseUrl + '/functions/v1/delete-account', {
    method: 'DELETE',
    headers: { apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + session.accessToken },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || 'Account deletion failed.')
  saveSession(null)
}
