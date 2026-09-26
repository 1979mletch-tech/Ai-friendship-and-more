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

export const removeHistoryTurn = <T extends { id: string; role: 'user' | 'assistant' }>(messages: T[], id: string): T[] => {
  const index = messages.findIndex((message) => message.id === id)
  if (index < 0) return messages
  const first = messages[index].role === 'assistant' && index > 0 && messages[index - 1].role === 'user'
    ? index - 1 : index
  const count = messages[first].role === 'user' && messages[first + 1]?.role === 'assistant' ? 2 : 1
  return messages.filter((_, position) => position < first || position >= first + count)
}
