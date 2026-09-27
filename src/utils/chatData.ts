export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
  dayKey: string
}

export type ProjectNote = {
  id: string
  project: string
  tags: string
  note: string
}

export const MAX_MESSAGE_LENGTH = 2000
export const MAX_NOTE_LENGTH = 1000
export const MAX_PROJECT_LENGTH = 80

export const readMessages = (value: unknown): ChatMessage[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ChatMessage =>
    item !== null && typeof item === 'object' &&
    typeof item.id === 'string' &&
    (item.role === 'user' || item.role === 'assistant') &&
    typeof item.text === 'string' && item.text.length <= MAX_MESSAGE_LENGTH &&
    typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt)) &&
    typeof item.dayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.dayKey),
  ).slice(-500)
}

export const readNotes = (value: unknown): ProjectNote[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ProjectNote =>
    item !== null && typeof item === 'object' && typeof item.id === 'string' &&
    typeof item.project === 'string' && item.project.length <= MAX_PROJECT_LENGTH &&
    typeof item.tags === 'string' && item.tags.length <= MAX_PROJECT_LENGTH &&
    typeof item.note === 'string' && item.note.length <= MAX_NOTE_LENGTH,
  ).slice(-100)
}

export const downloadLocalData = (messages: ChatMessage[], notes: ProjectNote[]): void => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), messages, notes }, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'ai-friendship-local-data.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
