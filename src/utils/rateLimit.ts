export const RATE_LIMIT_PER_MINUTE = 12
export const isRateLimited = (count: number, limit = RATE_LIMIT_PER_MINUTE) => Math.max(0, count) >= limit
export const retryAfterSeconds = (oldestEventMs: number, now = Date.now()) => Math.max(1, Math.ceil((oldestEventMs + 60_000 - now) / 1000))
