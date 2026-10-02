import { readCloudConfig } from '../config/cloud'
import { ensureFreshSession, type AuthSession } from './authService'
import type { ChatMode } from '../types/companion'
import { prepareAuroraChatContext } from '../utils/chatContext'

type OutboundMessage = { role: 'user' | 'assistant'; text: string }

type ProjectNoteInput = { project?: unknown; tags?: unknown; note?: unknown }

export type ChatResult = { reply: string; safetyFlag?: boolean; mode?: string }

const signalAuroraThinking = (busy: boolean) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aurora-ai-busy', { detail: busy }))
  }
}

const signalAuroraUserMessage = (text: string) => {
  if (typeof window !== 'undefined' && text.trim()) {
    window.dispatchEvent(new CustomEvent('aurora-user-message', { detail: text.slice(0, 2000) }))
  }
}

export const sendCloudChat = async (
  session: AuthSession,
  messages: OutboundMessage[],
  chatMode: ChatMode,
  companionName: string,
  memoryItems: unknown[] = [],
  projectNotes: ProjectNoteInput[] = [],
): Promise<ChatResult> => {
  const config = readCloudConfig()
  if (!config.chatApiUrl) throw new Error('Live AI is not configured.')

  const latestUserText = [...messages].reverse().find((message) => message.role === 'user')?.text ?? ''
  signalAuroraUserMessage(latestUserText)
  signalAuroraThinking(true)

  try {
    const activeSession = await ensureFreshSession(session)
    const context = prepareAuroraChatContext(memoryItems, projectNotes)
    const response = await fetch(config.chatApiUrl, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + activeSession.accessToken, apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.slice(-24).map(({ role, text }) => ({ role, text: text.slice(0, 2000) })),
        mode: chatMode,
        companionName: companionName.slice(0, 32),
        memory: context.memory,
        projectNotes: context.projectNotes,
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload?.error || 'The live AI service is unavailable.')
    if (typeof payload?.reply !== 'string' || !payload.reply.trim()) throw new Error('The live AI service returned an invalid response.')
    return { ...payload, reply: payload.reply.trim() }
  } finally {
    signalAuroraThinking(false)
  }
}
