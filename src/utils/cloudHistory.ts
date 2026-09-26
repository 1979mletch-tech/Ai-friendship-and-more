export type ConversationSummary = {
  id: string
  title: string
  mode: 'general' | 'creative'
  messageCount: number
  updatedAt: string
}

export const normalizeConversationTitle = (value: string) =>
  value.replace(/[<>\u0000]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Conversation'

export const conversationMatches = (title: string, messages: Array<{ text: string }>, query: string) => {
  const q = query.trim().toLocaleLowerCase()
  if (!q) return true
  return title.toLocaleLowerCase().includes(q) || messages.some((message) => message.text.toLocaleLowerCase().includes(q))
}

export const summarizeConversation = (conversation: { id: string; title: string; mode: 'general' | 'creative'; messages: unknown[]; updated_at?: string; updatedAt?: string }): ConversationSummary => ({
  id: conversation.id,
  title: normalizeConversationTitle(conversation.title),
  mode: conversation.mode,
  messageCount: conversation.messages.length,
  updatedAt: conversation.updated_at || conversation.updatedAt || '',
})
