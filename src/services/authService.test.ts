import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSession, saveSession, signIn, type AuthSession } from './authService'

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

  it('requires configured cloud auth', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    await expect(signIn('a@example.test', 'password123')).rejects.toThrow(/not configured/i)
  })
})
