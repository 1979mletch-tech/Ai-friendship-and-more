import { describe, expect, it } from 'vitest'
import { isRateLimited, retryAfterSeconds } from './rateLimit'
describe('rate limit helpers', () => {
  it('enforces threshold',()=>{expect(isRateLimited(11)).toBe(false);expect(isRateLimited(12)).toBe(true)})
  it('calculates retry seconds',()=>expect(retryAfterSeconds(1000,31000)).toBe(30))
})
