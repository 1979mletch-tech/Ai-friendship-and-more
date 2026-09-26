import { readCloudConfig } from '../config/cloud'
import type { AuthSession } from './authService'
import type { ChatMode, ChatMessage } from '../types/companion'

export type ChatResult = { reply: string; safetyFlag?: boolean; mode?: string }

export const sendCloudChat = async (
  session: AuthSession,
  messages: ChatMessage[],
  chatMode: ChatMode,
  companionName: string,
): Promise<ChatResult> => {
  const config = readCloudConfig()
  if (!config.chatApiUrl) throw new Error('Live AI is not configured.')
  const response = await fetch(config.chatApiUrl, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + session.accessToken, 'Content-Type': 'application/json' },
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
