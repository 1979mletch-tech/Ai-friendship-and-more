import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthSession } from './authService'

const calls = vi.hoisted(() => ({ list: vi.fn(), insert: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock('./cloudDataService', () => ({
  listUserRows: calls.list, insertUserRow: calls.insert, updateUserRow: calls.update, deleteUserRow: calls.remove,
}))
import { backupConversation, backupMemoryItems } from './cloudSyncServiceV2'

const session: AuthSession = {
  accessToken: 'token', refreshToken: 'refresh', expiresAt: Date.now() + 3600_000,
  user: { id: 'account-a', email: 'a@example.test' },
}

describe('memory backup', () => {
  beforeEach(() => { calls.list.mockReset(); calls.insert.mockReset(); calls.update.mockReset(); calls.remove.mockReset() })

  it('skips duplicate memories and preserves memories from another device', async () => {
    calls.list.mockResolvedValue([
      { id: 'existing', value: 'A novel', user_id: 'account-a' },
      { id: 'other-device', value: 'A painting', user_id: 'account-a' },
    ])
    calls.insert.mockResolvedValue([])
    await backupMemoryItems(session, ['a novel', 'A NOVEL', 'A poem'])
    expect(calls.insert).toHaveBeenCalledTimes(1)
    expect(calls.insert.mock.calls[0][2].value).toBe('A poem')
    expect(calls.remove).not.toHaveBeenCalled()
  })

  it('updates a stable conversation ID and recreates it if the remote row is missing', async () => {
    calls.update.mockResolvedValueOnce([{ id: 'stable-id' }]).mockResolvedValueOnce([])
    calls.insert.mockResolvedValue([{ id: 'stable-id' }])
    const messages = [{ id: 'message', role: 'user' as const, text: 'Hello' }]
    await backupConversation(session, 'My conversation', 'general', messages, 'stable-id')
    expect(calls.insert).not.toHaveBeenCalled()
    await backupConversation(session, 'My conversation', 'general', messages, 'stable-id')
    expect(calls.insert.mock.calls[0][2].id).toBe('stable-id')
  })
})
