export const safeTimestamp = (value: string | undefined) => {
  if (!value) return 'Saved locally'
  const time=Date.parse(value)
  return Number.isFinite(time) ? new Date(time).toLocaleString() : 'Saved locally'
}
export const sortNewestFirst = <T extends { updated_at?: string; updatedAt?: string }>(items:T[]) => [...items].sort((a,b)=>Date.parse(b.updated_at||b.updatedAt||'')-Date.parse(a.updated_at||a.updatedAt||''))
