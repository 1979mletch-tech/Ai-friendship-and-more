type ImportMessage = { id: string; role: 'user' | 'assistant'; text: string; createdAt?: string; dayKey?: string }
export const sanitizeImportedMessages = (value: unknown): ImportMessage[] => {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): ImportMessage[] => {
    if (!item || typeof item !== 'object') return []
    const m = item as Record<string, unknown>
    if ((m.role !== 'user' && m.role !== 'assistant') || typeof m.text !== 'string') return []
    const text = m.text.trim().slice(0, 2000)
    if (!text) return []
    return [{ id: typeof m.id === 'string' ? m.id.slice(0, 100) : crypto.randomUUID(), role: m.role, text, createdAt: typeof m.createdAt === 'string' ? m.createdAt : undefined, dayKey: typeof m.dayKey === 'string' ? m.dayKey : undefined }]
  }).slice(-200)
}
