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


export type OwnerProject = {
  id: 'ai-friendship' | 'ai-doctor'
  name: string
  status: 'active' | 'next' | 'paused'
  summary: string
}

export const sanitizeOwnerProjects = (value: unknown): OwnerProject[] => {
  if (!Array.isArray(value)) return []
  const allowedIds = new Set(['ai-friendship', 'ai-doctor'])
  const allowedStatuses = new Set(['active', 'next', 'paused'])
  const seen = new Set<string>()
  return value.flatMap((item): OwnerProject[] => {
    if (!item || typeof item !== 'object') return []
    const candidate = item as Partial<OwnerProject>
    if (!candidate.id || !allowedIds.has(candidate.id) || seen.has(candidate.id)) return []
    seen.add(candidate.id)
    const name = typeof candidate.name === 'string' ? candidate.name.trim().slice(0, 80) : ''
    const summary = typeof candidate.summary === 'string'
      ? candidate.summary.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
      : ''
    return [{
      id: candidate.id,
      name: name || (candidate.id === 'ai-doctor' ? 'AI Doctor' : 'AI Friendship'),
      status: candidate.status && allowedStatuses.has(candidate.status) ? candidate.status : 'paused',
      summary,
    }]
  })
}

export const defaultOwnerProjects = (): OwnerProject[] => [
  { id: 'ai-friendship', name: 'AI Friendship', status: 'active', summary: 'Current build, verification and launch work.' },
  { id: 'ai-doctor', name: 'AI Doctor', status: 'next', summary: 'Separate project. Connect and verify its repository before Owner Aurora reports live project state.' },
]
