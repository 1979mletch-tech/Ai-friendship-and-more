export const SESSION_REFRESH_SKEW_MS = 60_000
export const sessionNeedsRefresh = (expiresAt: number, now = Date.now()) => expiresAt - now <= SESSION_REFRESH_SKEW_MS
export const sessionIsExpired = (expiresAt: number, now = Date.now()) => expiresAt <= now
