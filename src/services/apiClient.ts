import { safeStatusMessage } from '../utils/httpStatusPolicy'
import { serviceFetch } from './serviceFetch'
import { readAppEnv } from '../config/env'

export type SessionUser = { id: string; email: string; displayName?: string }
export type Session = { user: SessionUser; accessToken: string }

const request = async <T>(path: string, init: RequestInit = {}, token?: string): Promise<T> => {
  const { apiBaseUrl } = readAppEnv()
  if (!apiBaseUrl) throw new Error('Server API is not configured.')
  const response = await serviceFetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  })
  if (!response.ok) throw new Error(safeStatusMessage(response.status, 'The request could not be completed.'))
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export const authApi = {
  signIn: (email: string, password: string) => request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signUp: (email: string, password: string, displayName: string) => request<Session>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
  signOut: (token: string) => request<void>('/auth/logout', { method: 'POST' }, token),
  deleteAccount: (token: string) => request<void>('/account', { method: 'DELETE' }, token),
}

export const companionApi = {
  reply: (token: string, message: string, mode: 'general' | 'creative', conversationId?: string) =>
    request<{ reply: string; conversationId: string }>('/companion/reply', {
      method: 'POST',
      body: JSON.stringify({ message, mode, conversationId }),
    }, token),
}
