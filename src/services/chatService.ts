import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'
import type { ChatMode } from '../types/companion'

type OutboundMessage = { role: 'user' | 'assistant'; text: string }

export type ChatResult = { reply: string; safetyFlag?: boolean; mode?: string }

export const sendCloudChat = async (
  session: AuthSession,
  messages: OutboundMessage[],
  chatMode: ChatMode,
  companionName: string,
): Promise<ChatResult> => {
  const config = readCloudConfig()
  if (!config.chatApiUrl) throw new Error('Live AI is not configured.')
  const activeSession = await ensureFreshSession(session)
  const response = await fetch(config.chatApiUrl, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + activeSession.accessToken, apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.slice(-24).map(({ role, text }) => ({ role, text: text.slice(0, 2000) })),
      mode: chatMode,
      companionName: companionName.slice(0, 32),
    }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || 'The live AI service is unavailable.')
  if (typeof payload?.reply !== 'string') throw new Error('The live AI service returned an invalid response.')
  return payload
}
