import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendCloudChat } from './chatService'
import type { AuthSession } from './authService'

const session: AuthSession = {
  accessToken: 'test-token',
  refreshToken: 'refresh',
  expiresAt: Date.now() + 120_000,
  user: { id: 'user-a', email: 'a@example.test' },
}

describe('chat service', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('refuses live chat when no server endpoint is configured', async () => {
    vi.stubEnv('VITE_CHAT_API_URL', '')
    await expect(sendCloudChat(session, [], 'general', 'Friend')).rejects.toThrow(/not configured/i)
  })

  it('sends bearer auth and bounded message content', async () => {
    vi.stubEnv('VITE_CHAT_API_URL', 'https://example.test/chat')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ reply: 'hello', mode: 'live' }), { status: 200 }),
    )
    const result = await sendCloudChat(
      session,
      [{ role: 'user', text: 'x'.repeat(3000) }],
      'creative',
      'Nova',
    )
    expect(result.reply).toBe('hello')
    const call = fetchMock.mock.calls[0]
    expect(call).toBeDefined()
    if (!call) throw new Error('Expected fetch to be called')
    const [, init] = call
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-token')
    const body = JSON.parse(String(init?.body))
    expect(body.messages[0].text).toHaveLength(2000)
  })

  it('rejects malformed server responses', async () => {
    vi.stubEnv('VITE_CHAT_API_URL', 'https://example.test/chat')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await expect(sendCloudChat(session, [], 'general', 'Friend')).rejects.toThrow(/invalid response/i)
  })
  it('refreshes an expiring session before sending private messages', async () => {
    vi.stubEnv('VITE_CHAT_API_URL', 'https://example.test/chat')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.test')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key')
    Object.defineProperty(globalThis, 'localStorage', { value: { setItem: vi.fn() }, configurable: true })
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'new-token', refresh_token: 'new-refresh', expires_in: 3600, user: { id: 'user-a', email: 'a@example.test' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ reply: 'hello' })))
    await sendCloudChat({ ...session, expiresAt: Date.now() - 1 }, [{ role: 'user', text: 'hello' }], 'general', 'Friend')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((fetchMock.mock.calls[1][1]?.headers as Record<string, string>).Authorization).toBe('Bearer new-token')
    expect((fetchMock.mock.calls[1][1]?.headers as Record<string, string>).apikey).toBe('public-anon-key')
  })

})
