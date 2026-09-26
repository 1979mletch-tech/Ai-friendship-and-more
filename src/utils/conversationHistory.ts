export type ConversationSummary = {
  id: string
  title: string
  updatedAt: string
}

export const makeConversationTitle = (firstMessage: string): string => {
  const clean = firstMessage.trim().replace(/\s+/g, ' ')
  if (!clean) return 'New conversation'
  return clean.length > 48 ? clean.slice(0, 45) + '…' : clean
}

export const sortConversations = (items: ConversationSummary[]): ConversationSummary[] =>
  [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
