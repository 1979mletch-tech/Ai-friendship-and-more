import { afterEach, describe, expect, it, vi } from 'vitest'
import { getOwnerAuroraStatus, sendOwnerAuroraChat } from './ownerAuroraService'
import type { AuthSession } from './authService'

const session: AuthSession = {
  accessToken: 'owner-token',
  refreshToken: 'refresh',
  expiresAt: Date.now() + 120_000,
  user: { id: 'owner-user', email: 'owner@example.test' },
}

describe('Owner Aurora service', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('keeps owner access server-authoritative', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-key')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ owner: false }), { status: 403 }))
    await expect(getOwnerAuroraStatus(session)).resolves.toEqual({ owner: false, readiness: undefined })
  })

  it('returns only safe readiness booleans from owner status', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-key')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      owner: true,
      readiness: { ai: true, speech: true, billing: true, webhook: false, ageVerification: true, returnUrl: true },
    }), { status: 200 }))
    const result = await getOwnerAuroraStatus(session)
    expect(result.owner).toBe(true)
    expect(result.readiness?.webhook).toBe(false)
    expect(Object.values(result.readiness || {}).every((value) => typeof value === 'boolean')).toBe(true)
  })

  it('bounds owner chat history and owner-approved notes', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-key')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ owner: true, reply: 'Ready.' }), { status: 200 }))
    const messages = Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      text: `message-${index}-` + 'x'.repeat(1900),
    }))
    const notes = Array.from({ length: 15 }, (_, index) => `note-${index}-` + 'y'.repeat(300))
    const reply = await sendOwnerAuroraChat(session, messages, notes)
    expect(reply).toBe('Ready.')
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(String(init?.body))
    expect(body.messages).toHaveLength(16)
    expect(body.messages.every((item: { text: string }) => item.text.length <= 1800)).toBe(true)
    expect(body.notes).toHaveLength(12)
    expect(body.notes.every((item: string) => item.length <= 280)).toBe(true)
  })
})
