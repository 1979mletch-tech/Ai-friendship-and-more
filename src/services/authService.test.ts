import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureFreshSession, loadSession, requestPasswordReset, saveSession, signIn, signUp, type AuthSession } from './authService'

const mockStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  }
}

describe('auth service', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: mockStorage(), configurable: true })
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('round-trips a local session envelope', () => {
    const session: AuthSession = {
      accessToken: 'token', refreshToken: 'refresh', expiresAt: Date.now() + 1000,
      user: { id: 'u1', email: 'user@example.test' },
    }
    saveSession(session)
    expect(loadSession()?.user.id).toBe('u1')
    saveSession(null)
    expect(loadSession()).toBeNull()
  })

  it('drops expired cached sessions', () => {
    localStorage.setItem('ai_friendship_auth_session', JSON.stringify({
      accessToken: 'expired', refreshToken: '', expiresAt: Date.now() - 1,
      user: { id: 'u1', email: 'user@example.test' },
    }))
    expect(loadSession()).toBeNull()
  })

  it('retains an expired access token only when it can be refreshed', () => {
    localStorage.setItem('ai_friendship_auth_session', JSON.stringify({
      accessToken: 'expired', refreshToken: 'refreshable', expiresAt: Date.now() - 1,
      user: { id: 'u1', email: 'user@example.test' },
    }))
    expect(loadSession()?.refreshToken).toBe('refreshable')
  })

  it('reuses a rotated token saved by another request for the same user', async () => {
    const expired: AuthSession = {
      accessToken: 'old', refreshToken: 'old-refresh', expiresAt: Date.now() - 1,
      user: { id: 'u1', email: 'user@example.test' },
    }
    const current = { ...expired, accessToken: 'new', refreshToken: 'new-refresh', expiresAt: Date.now() + 3600_000 }
    saveSession(current)
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    expect(await ensureFreshSession(expired)).toEqual(current)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses refresh responses that switch the account identity', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.test')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-key')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      access_token: 'other-token', refresh_token: 'other-refresh', expires_in: 3600,
      user: { id: 'u2', email: 'other@example.test' },
    })))
    await expect(ensureFreshSession({
      accessToken: 'old', refreshToken: 'old-refresh', expiresAt: Date.now() - 1,
      user: { id: 'u1', email: 'user@example.test' },
    })).rejects.toThrow(/identity changed/i)
    expect(loadSession()).toBeNull()
  })

  it('requires configured cloud auth', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    await expect(signIn('a@example.test', 'password123')).rejects.toThrow(/not configured/i)
  })

  it('rejects invalid registration and recovery inputs before network requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    await expect(signUp('bad-email', 'strongpassword')).rejects.toThrow(/valid email/i)
    await expect(signUp('person@example.test', 'short')).rejects.toThrow(/password/i)
    await expect(requestPasswordReset('bad-email')).rejects.toThrow(/valid email/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
