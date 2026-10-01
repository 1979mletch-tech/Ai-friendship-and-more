export const validateBackupPayload = (value: unknown) => {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return item.product === 'AI Friendship' &&
    typeof item.exportedAt === 'string' &&
    Array.isArray(item.messages) &&
    Array.isArray(item.memory) &&
    Array.isArray(item.projectNotes)
}
