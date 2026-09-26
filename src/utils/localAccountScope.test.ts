import { describe, expect, it } from 'vitest'
import { accountDataKeys, accountDeletionKeys, localAccountKey } from './localAccountScope'
import type { AuthSession } from '../services/authService'

const identity = (id: string): AuthSession => ({
  accessToken: 'token', refreshToken: 'refresh', expiresAt: Date.now() + 60_000,
  user: { id, email: `${id}@example.test` },
})

describe('local account data scope', () => {
  it('keeps guest and separate accounts on distinct storage keys', () => {
    const key = 'ai_friendship_messages'
    expect(localAccountKey(key, null)).toBe(key)
    expect(localAccountKey(key, identity('alice'))).not.toBe(localAccountKey(key, identity('bob')))
    expect(localAccountKey(key, identity('alice'))).not.toBe(key)
  })

  it('limits deletion to the active identity', () => {
    expect(accountDataKeys(identity('alice'))).not.toContain('ai_friendship_messages')
    expect(accountDataKeys(identity('alice'))).not.toEqual(accountDataKeys(identity('bob')))
  })

  it('removes account preferences on deletion without erasing guest data', () => {
    const keys = accountDeletionKeys(identity('alice'))
    expect(keys).toContain('ai_friendship_consent:account:alice')
    expect(keys).toContain('ai_friendship_companion_name:account:alice')
    expect(keys).not.toContain('ai_friendship_consent')
  })
})
