import type { ChatMessage } from '../types/companion'
import { isCrisisContactFollowUp, isCrisisText } from './safety'

export const countUserMessagesForDay = (messages: ChatMessage[], dayKey: string) =>
  messages.filter((message) => message.role === 'user' && message.dayKey === dayKey).length

export const remainingMessages = (used: number, limit: number) => Math.max(0, limit - Math.max(0, used))

// Quotas must not hide immediate-safety guidance. The client handles these
// locally, without calling the paid AI endpoint.
export const canSendAtLimit = (text: string, used: number, limit: number, previous: Pick<ChatMessage, 'role' | 'text'>[] = []) =>
  used < limit || isCrisisText(text) || isCrisisContactFollowUp(text, previous)
