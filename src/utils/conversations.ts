export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt?: string
  dayKey?: string
}

export type Conversation = {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

export const normalizeConversations = (value: unknown): Conversation[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Conversation =>
    Boolean(item && typeof item === 'object' && typeof item.id === 'string' &&
      typeof item.title === 'string' && typeof item.updatedAt === 'string' &&
      Array.isArray(item.messages) && item.messages.every((message: unknown) =>
        Boolean(message && typeof message === 'object' &&
          typeof (message as ChatMessage).id === 'string' &&
          typeof (message as ChatMessage).text === 'string' &&
          ((message as ChatMessage).role === 'user' || (message as ChatMessage).role === 'assistant')))),
  )
}

export const titleFromMessage = (text: string): string => text.slice(0, 48).trim() || 'New conversation'
