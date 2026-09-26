import { readCloudConfig } from '../config/cloud'
import type { AuthSession } from './authService'

const headers = (session: AuthSession) => {
  const config = readCloudConfig()
  return {
    apikey: config.supabaseAnonKey,
    Authorization: 'Bearer ' + session.accessToken,
    'Content-Type': 'application/json',
  }
}

const endpoint = (table: string, query = '') => readCloudConfig().supabaseUrl + '/rest/v1/' + table + query

const ensureOk = async (response: Response) => {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.message || 'Cloud data request failed.')
  }
  return response
}

export const listUserRows = async <T>(session: AuthSession, table: 'conversations' | 'memories'): Promise<T[]> => {
  const response = await ensureOk(await fetch(endpoint(table, '?select=*&order=updated_at.desc'), { headers: headers(session) }))
  return response.json()
}

export const insertUserRow = async <T extends Record<string, unknown>>(session: AuthSession, table: 'conversations' | 'memories', row: T) => {
  const response = await ensureOk(await fetch(endpoint(table), {
    method: 'POST',
    headers: { ...headers(session), Prefer: 'return=representation' },
    body: JSON.stringify({ ...row, user_id: session.user.id }),
  }))
  return response.json()
}

export const deleteUserRow = async (session: AuthSession, table: 'conversations' | 'memories', id: string) => {
  await ensureOk(await fetch(endpoint(table, '?id=eq.' + encodeURIComponent(id)), { method: 'DELETE', headers: headers(session) }))
}
