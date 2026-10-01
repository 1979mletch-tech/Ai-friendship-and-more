export type StoredOwnerMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

export const sanitizeOwnerMessages = (value: unknown): StoredOwnerMessage[] => {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): StoredOwnerMessage[] => {
    if (!item || typeof item !== 'object') return []
    const candidate = item as Partial<StoredOwnerMessage>
    if (typeof candidate.id !== 'string' || (candidate.role !== 'user' && candidate.role !== 'assistant') || typeof candidate.text !== 'string') return []
    const text = candidate.text.trim().slice(0, 5000)
    if (!text) return []
    return [{
      id: candidate.id.slice(0, 120),
      role: candidate.role,
      text,
      createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt.slice(0, 80) : new Date(0).toISOString(),
    }]
  }).slice(-60)
}

export const sanitizeOwnerNotes = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return [...new Set(value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280))
    .filter(Boolean))]
    .slice(-30)
}

export const createOwnerWorkspaceExport = (messages: StoredOwnerMessage[], notes: string[]) => ({
  product: 'AI Friendship',
  workspace: 'Owner Aurora',
  exportedAt: new Date().toISOString(),
  messages: sanitizeOwnerMessages(messages),
  notes: sanitizeOwnerNotes(notes),
})
