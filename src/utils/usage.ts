import type { ChatMessage } from '../types/companion'

export const countUserMessagesForDay = (messages: ChatMessage[], dayKey: string) =>
  messages.filter((message) => message.role === 'user' && message.dayKey === dayKey).length

export const remainingMessages = (used: number, limit: number) => Math.max(0, limit - Math.max(0, used))
