export type ReturnFlow =
  | { kind: 'billing-success' }
  | { kind: 'billing-cancel' }
  | { kind: 'billing-portal' }
  | { kind: 'age-return' }
  | null

const allowedKinds = new Set(['billing-success', 'billing-cancel', 'billing-portal', 'age-return'])

export const parseReturnFlow = (search: string): ReturnFlow => {
  const params = new URLSearchParams(search)
  const raw = params.get('return')
  if (!raw || !allowedKinds.has(raw)) return null
  return { kind: raw as Exclude<ReturnFlow, null>['kind'] }
}

export const clearReturnFlowFromUrl = () => {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('return')
  url.searchParams.delete('session_id')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

export const withReturnMarker = (base: string, marker: Exclude<ReturnFlow, null>['kind']): string => {
  const url = new URL(base)
  url.searchParams.set('return', marker)
  return url.toString()
}
