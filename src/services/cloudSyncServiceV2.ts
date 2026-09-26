import type { AuthSession } from './authService'
import { deleteUserRow, insertUserRow, listUserRows, updateUserRow } from './cloudDataService'

export type CloudConversationRow = {
  id: string
  user_id: string
  title: string
  mode: 'general' | 'creative'
  messages: Array<{ id: string; role: 'user' | 'assistant'; text: string; createdAt?: string; dayKey?: string }>
  created_at: string
  updated_at: string
}
export type CloudMemoryRow = {
  id: string
  user_id: string
  label: string
  value: string
  created_at: string
  updated_at: string
}
export const loadCloudConversations = (session: AuthSession) =>
  listUserRows<CloudConversationRow>(session, 'conversations')
export const loadCloudMemories = (session: AuthSession) =>
  listUserRows<CloudMemoryRow>(session, 'memories')
export const backupConversation = async (
  session: AuthSession,
  title: string,
  mode: 'general' | 'creative',
  messages: CloudConversationRow['messages'],
  existingId?: string,
) => {
  if (!messages.length) return []
  const row = { title: title.trim().slice(0, 120) || 'Conversation', mode, messages: messages.slice(-200), updated_at: new Date().toISOString() }
  return existingId ? updateUserRow(session, 'conversations', existingId, row) : insertUserRow(session, 'conversations', row)
}
export const deleteCloudConversation = (session: AuthSession, id: string) =>
  deleteUserRow(session, 'conversations', id)
export const backupMemoryItems = async (session: AuthSession, items: string[]) => {
  const desired = [...new Set(items.map((item) => item.trim()).filter(Boolean).map((item) => item.slice(0, 500)))].slice(0, 50)
  const existing = await loadCloudMemories(session)
  const byValue = new Map(existing.map((item) => [item.value.toLocaleLowerCase(), item]))
  const results = []
  for (const value of desired) {
    const match = byValue.get(value.toLocaleLowerCase())
    if (!match) results.push(await insertUserRow(session, 'memories', { label: 'User-approved memory', value }))
  }
  return results
}
export const deleteCloudMemory = (session: AuthSession, id: string) =>
  deleteUserRow(session, 'memories', id)
