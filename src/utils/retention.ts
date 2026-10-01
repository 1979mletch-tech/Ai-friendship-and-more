export const DEFAULT_LOCAL_RETENTION_DAYS = 30
export const retainRecent = <T extends { createdAt?: string }>(items: T[], days = DEFAULT_LOCAL_RETENTION_DAYS, now = Date.now()) => {
  const cutoff = now - Math.max(1, days) * 86_400_000
  return items.filter((item) => !item.createdAt || Date.parse(item.createdAt) >= cutoff)
}
