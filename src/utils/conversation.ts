import type { ChatMessage } from '../types/companion'

export const renameConversation = (name: string) => {
  const clean = name.replace(/[<>\u0000]/g, '').replace(/\s+/g, ' ').trim()
  return clean.slice(0, 120) || 'Conversation'
}

export const searchableTranscript = (messages: ChatMessage[]) =>
  messages.map((message) => message.text).join('\n').toLocaleLowerCase()

export const matchesConversationSearch = (messages: ChatMessage[], query: string) => {
  const needle = query.trim().toLocaleLowerCase()
  return !needle || searchableTranscript(messages).includes(needle)
}
