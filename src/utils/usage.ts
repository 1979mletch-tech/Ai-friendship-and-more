import type { ChatMessage } from '../types/companion'
import { isCrisisText } from './safety'

export const countUserMessagesForDay = (messages: ChatMessage[], dayKey: string) =>
  messages.filter((message) => message.role === 'user' && message.dayKey === dayKey).length

export const countUserMessagesTotal = (messages: Array<Pick<ChatMessage, 'role'>>) =>
  messages.filter((message) => message.role === 'user').length

export const remainingMessages = (used: number, limit: number) => Math.max(0, limit - Math.max(0, used))

// Quotas must not hide immediate-safety guidance. The client handles these
// locally, without calling the paid AI endpoint.
export const canSendAtLimit = (text: string, used: number, limit: number) =>
  used < limit || isCrisisText(text)
