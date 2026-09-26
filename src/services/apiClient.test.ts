import { describe, expect, it, vi } from 'vitest'
import { authApi } from './apiClient'

describe('API client', () => {
  it('never sends a password in a URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://example.test')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user: { id: 'u1', email: 'a@b.test' }, accessToken: 'token' }) })
    vi.stubGlobal('fetch', fetchMock)
    await authApi.signIn('a@b.test', 'super-secret')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.test/auth/login')
    expect(String(url)).not.toContain('super-secret')
    expect(init.method).toBe('POST')
    expect(init.body).toContain('super-secret')
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })
})


describe('empty success responses', () => {
  it('handles 204 logout without parsing JSON', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
    const json = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json }))
    await expect(authApi.signOut('token')).resolves.toBeUndefined()
    expect(json).not.toHaveBeenCalled()
    vi.unstubAllGlobals(); vi.unstubAllEnvs()
  })
})
