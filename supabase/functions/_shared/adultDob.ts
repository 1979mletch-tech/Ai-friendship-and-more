export const isAdultDob = (dob: unknown, now = new Date()): boolean => {
  if (!dob || typeof dob !== 'object') return false
  const value = dob as Record<string, unknown>
  const year = Number(value.year), month = Number(value.month), day = Number(value.day)
  if (![year, month, day].every(Number.isInteger)) return false
  const birth = new Date(Date.UTC(year, month - 1, day))
  const cutoff = new Date(Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate()))
  return birth.getUTCFullYear() === year && birth.getUTCMonth() === month - 1 &&
    birth.getUTCDate() === day && birth > new Date('1900-01-01T00:00:00Z') && birth <= cutoff
}
