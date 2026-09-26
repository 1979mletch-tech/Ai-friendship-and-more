import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendCloudChat } from './chatService'
import type { AuthSession } from './authService'

const session: AuthSession = {
  accessToken: 'test-token',
  refreshToken: 'refresh',
  expiresAt: Date.now() + 60_000,
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
    const [, init] = fetchMock.mock.calls[0]
    expect((init && init.headers as Record<string, string>).Authorization).toBe('Bearer test-token')
    const body = JSON.parse(String(init?.body))
    expect(body.messages[0].text).toHaveLength(2000)
  })

  it('rejects malformed server responses', async () => {
    vi.stubEnv('VITE_CHAT_API_URL', 'https://example.test/chat')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await expect(sendCloudChat(session, [], 'general', 'Friend')).rejects.toThrow(/invalid response/i)
  })
})
