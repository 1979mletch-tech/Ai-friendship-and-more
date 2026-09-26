export type ChatMode = 'general' | 'creative'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
  dayKey: string
}

export type Conversation = {
  id: string
  title: string
  mode: ChatMode
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export type MemoryItem = {
  id: string
  label: string
  value: string
  createdAt: string
}

export type CompanionProfile = {
  companionName: string
  userName: string
  tone: 'warm' | 'calm' | 'creative' | 'direct'
  interests: string
  memoryEnabled: boolean
}

export const defaultProfile: CompanionProfile = {
  companionName: 'Friend',
  userName: '',
  tone: 'warm',
  interests: '',
  memoryEnabled: true,
}

export const createConversation = (mode: ChatMode = 'general'): Conversation => {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'New conversation',
    mode,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}

export const conversationTitle = (text: string): string => {
  const compact = text.trim().replace(/\s+/g, ' ')
  return compact.length > 44 ? compact.slice(0, 41) + '…' : compact || 'New conversation'
}

export const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ChatMessage>
  return (
    typeof item.id === 'string' &&
    (item.role === 'user' || item.role === 'assistant') &&
    typeof item.text === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.dayKey === 'string'
  )
}

export const sanitizeConversations = (value: unknown): Conversation[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Conversation => {
    if (!item || typeof item !== 'object') return false
    const c = item as Partial<Conversation>
    return (
      typeof c.id === 'string' &&
      typeof c.title === 'string' &&
      (c.mode === 'general' || c.mode === 'creative') &&
      Array.isArray(c.messages) &&
      c.messages.every(isChatMessage) &&
      typeof c.createdAt === 'string' &&
      typeof c.updatedAt === 'string'
    )
  })
}
