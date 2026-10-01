import type { AuthSession } from './authService'
import { insertUserRow } from './cloudDataService'

export const backupConversation = async (
  session: AuthSession,
  title: string,
  mode: 'general' | 'creative',
  messages: Array<{ id: string; role: 'user' | 'assistant'; text: string; createdAt?: string; dayKey?: string }>,
) => {
  if (!messages.length) return []
  return insertUserRow(session, 'conversations', {
    title: title.trim().slice(0, 120) || 'Conversation',
    mode,
    messages: messages.slice(-200),
    updated_at: new Date().toISOString(),
  })
}

export const backupMemoryItems = async (session: AuthSession, items: string[]) => {
  const unique = [...new Set(items.map((item) => item.trim()).filter(Boolean))].slice(0, 50)
  const results = []
  for (const value of unique) {
    results.push(await insertUserRow(session, 'memories', { label: 'User-approved memory', value: value.slice(0, 500) }))
  }
  return results
}
