import { describe, expect, it } from 'vitest'
import { isSafePassword, readRecoveryAccessToken, recoveryRoute } from './recovery'

describe('recovery helpers', () => {
  it('accepts only recovery tokens', () => {
    expect(readRecoveryAccessToken('#type=recovery&access_token=abc')).toBe('abc')
    expect(readRecoveryAccessToken('#type=signup&access_token=abc')).toBe('')
  })
  it('supports query-style recovery hashes', () => {
    expect(readRecoveryAccessToken('#/account?type=recovery&access_token=token123')).toBe('token123')
    expect(recoveryRoute('#/account?type=recovery&access_token=token123')).toBe('/account')
  })
  it('enforces password bounds', () => {
    expect(isSafePassword('1234567')).toBe(false)
    expect(isSafePassword('12345678')).toBe(true)
    expect(isSafePassword('x'.repeat(129))).toBe(false)
  })
})
