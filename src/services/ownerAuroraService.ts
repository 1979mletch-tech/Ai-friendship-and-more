import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'

type OwnerMessage = { role: 'user' | 'assistant'; text: string }

const request = async (session: AuthSession, body: object) => {
  const config = readCloudConfig()
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error('Owner Aurora is not configured.')
  const active = await ensureFreshSession(session)
  const response = await fetch(`${config.supabaseUrl}/functions/v1/owner-aurora`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${active.accessToken}`,
      apikey: config.supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 403 && payload?.owner === false) return { owner: false }
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'Owner Aurora is unavailable.')
  }
  return payload
}

export const getOwnerAuroraAccess = async (session: AuthSession): Promise<boolean> => {
  const result = await request(session, { action: 'status' })
  return result?.owner === true
}

export const sendOwnerAuroraChat = async (
  session: AuthSession,
  messages: OwnerMessage[],
  notes: string[],
): Promise<string> => {
  const boundedMessages = messages.slice(-16).map((item) => ({
    role: item.role,
    text: item.text.trim().slice(0, 1800),
  })).filter((item) => item.text)
  const boundedNotes = [...new Set(notes.map((item) => item.trim().slice(0, 280)).filter(Boolean))].slice(-12)
  const result = await request(session, { action: 'chat', messages: boundedMessages, notes: boundedNotes })
  if (typeof result?.reply !== 'string' || !result.reply.trim()) throw new Error('Owner Aurora returned an invalid response.')
  return result.reply.trim()
}
