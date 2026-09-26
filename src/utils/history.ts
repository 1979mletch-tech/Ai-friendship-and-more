import type { ChatMessage } from '../types/companion'

export const filterHistory = (messages: ChatMessage[], query: string) => {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return messages
  return messages.filter((message) => message.text.toLocaleLowerCase().includes(needle))
}

export const historySummary = (messages: ChatMessage[]) => ({
  total: messages.length,
  user: messages.filter((message) => message.role === 'user').length,
  assistant: messages.filter((message) => message.role === 'assistant').length,
})
