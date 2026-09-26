import { readCloudConfig } from '../config/cloud'
import type { AuthSession } from './authService'

export type CloudTable = 'conversations' | 'memories' | 'profiles'
const headers = (session: AuthSession) => {
  const config = readCloudConfig()
  return { apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + session.accessToken, 'Content-Type': 'application/json' }
}
const endpoint = (table: CloudTable, query = '') => readCloudConfig().supabaseUrl + '/rest/v1/' + table + query
const ensureOk = async (response: Response) => {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.message || payload?.hint || 'Cloud data request failed.')
  }
  return response
}
export const listUserRows = async <T>(session: AuthSession, table: 'conversations' | 'memories'): Promise<T[]> => {
  const response = await ensureOk(await fetch(endpoint(table, '?select=*&order=updated_at.desc'), { headers: headers(session) }))
  return response.json()
}
export const insertUserRow = async <T extends Record<string, unknown>>(session: AuthSession, table: 'conversations' | 'memories', row: T) => {
  const response = await ensureOk(await fetch(endpoint(table), { method: 'POST', headers: { ...headers(session), Prefer: 'return=representation' }, body: JSON.stringify({ ...row, user_id: session.user.id }) }))
  return response.json()
}
export const updateUserRow = async <T extends Record<string, unknown>>(session: AuthSession, table: 'conversations' | 'memories', id: string, patch: T) => {
  const response = await ensureOk(await fetch(endpoint(table, '?id=eq.' + encodeURIComponent(id)), { method: 'PATCH', headers: { ...headers(session), Prefer: 'return=representation' }, body: JSON.stringify({ ...patch, user_id: session.user.id }) }))
  return response.json()
}
export const deleteUserRow = async (session: AuthSession, table: 'conversations' | 'memories', id: string) => {
  await ensureOk(await fetch(endpoint(table, '?id=eq.' + encodeURIComponent(id)), { method: 'DELETE', headers: headers(session) }))
}
export type CloudProfile = {
  user_id: string
  companion_name: string
  tone: 'warm' | 'calm' | 'creative' | 'direct'
  interests: string
  memory_enabled: boolean
  updated_at: string
}
export const getProfile = async (session: AuthSession): Promise<CloudProfile | null> => {
  const response = await ensureOk(await fetch(endpoint('profiles', '?select=*&user_id=eq.' + encodeURIComponent(session.user.id)), { headers: headers(session) }))
  const rows = (await response.json()) as CloudProfile[]
  return rows[0] || null
}
export const saveProfile = async (session: AuthSession, profile: Pick<CloudProfile, 'companion_name' | 'tone' | 'interests' | 'memory_enabled'>): Promise<CloudProfile | null> => {
  const response = await ensureOk(await fetch(endpoint('profiles', '?on_conflict=user_id'), {
    method: 'POST',
    headers: { ...headers(session), Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ user_id: session.user.id, companion_name: profile.companion_name.trim().slice(0, 32) || 'Friend', tone: profile.tone, interests: profile.interests.trim().slice(0, 500), memory_enabled: profile.memory_enabled, updated_at: new Date().toISOString() }),
  }))
  const rows = (await response.json()) as CloudProfile[]
  return rows[0] || null
}
