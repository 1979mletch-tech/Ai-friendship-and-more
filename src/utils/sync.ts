export type SyncState = 'idle' | 'syncing' | 'synced' | 'error'

export const syncStatusCopy = (state: SyncState) => {
  switch (state) {
    case 'syncing': return 'Syncing with your account…'
    case 'synced': return 'Cloud sync complete.'
    case 'error': return 'Cloud sync failed. Your local copy is unchanged.'
    default: return ''
  }
}

export const mergeUniqueMemory = (local: string[], cloud: string[], limit = 50) => {
  const map = new Map<string, string>()
  for (const value of [...cloud, ...local]) {
    const clean = value.trim().slice(0, 500)
    if (clean) map.set(clean.toLocaleLowerCase(), clean)
  }
  return [...map.values()].slice(-limit)
}
