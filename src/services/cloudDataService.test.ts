import { afterEach, describe, expect, it, vi } from 'vitest'
import { deleteUserRow, listUserRows, updateUserRow } from './cloudDataService'
import type { AuthSession } from './authService'

const session: AuthSession = {
  accessToken: 'test-token', refreshToken: 'refresh', expiresAt: Date.now() + 3600_000,
  user: { id: 'account-a', email: 'a@example.test' },
}

describe('cloud data account boundary', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

  it('requests only owned rows and ignores a foreign row in a malformed response', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.test')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-key')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([
      { id: 'own', user_id: 'account-a' }, { id: 'foreign', user_id: 'account-b' },
    ])))
    const rows = await listUserRows<{ id: string; user_id: string }>(session, 'conversations')
    expect(rows.map((row) => row.id)).toEqual(['own'])
    expect(String(fetchMock.mock.calls[0][0])).toContain('user_id=eq.account-a')
  })

  it('constrains updates and deletion by row ID and authenticated user ID', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.test')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-key')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'))
    await updateUserRow(session, 'memories', 'memory-b', { value: 'new' })
    await deleteUserRow(session, 'memories', 'memory-b')
    for (const [url] of fetchMock.mock.calls) {
      expect(String(url)).toContain('id=eq.memory-b')
      expect(String(url)).toContain('user_id=eq.account-a')
    }
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).user_id).toBe('account-a')
  })
})
