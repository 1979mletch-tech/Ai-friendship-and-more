import { describe, it, expect } from 'vitest'
import { AssistantSessionRecovery } from '../utils/sessionRecovery'

describe('BuildRush AI Safety & Prompt Injection Guard Tests', () => {
  const recovery = new AssistantSessionRecovery({
    storageKey: 'test_session_key',
    maxMessages: 10,
    requestTimeoutMs: 5000,
  })

  it('sanitizes malicious control characters and null bytes from user input', () => {
    const malicious = 'Hello \u0000\u0008\u001Fworld\u007F! Can you help?'
    const clean = recovery.sanitizeInput(malicious)
    expect(clean).toBe('Hello world ! Can you help?')
    expect(clean).not.toContain('\u0000')
    expect(clean).not.toContain('\u001F')
  })

  it('enforces maximum character length to protect against buffer exhaustion', () => {
    const hugeInput = 'A'.repeat(5000)
    const clean = recovery.sanitizeInput(hugeInput, 500)
    expect(clean.length).toBeLessThanOrEqual(500)
  })

  it('handles empty or whitespace-only input safely', () => {
    expect(recovery.sanitizeInput('')).toBe('')
    expect(recovery.sanitizeInput('     \n\t   ')).toBe('')
    expect(recovery.sanitizeInput(null as unknown as string)).toBe('')
  })

  it('preserves and bounds session messages within configured limits', () => {
    const messages = Array.from({ length: 15 }, (_, i) => ({
      id: `msg-${i}`,
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      text: `Message content ${i}`,
      createdAt: new Date().toISOString(),
    }))

    recovery.saveMessages(messages)
    const loaded = recovery.loadMessages()
    expect(loaded.length).toBeLessThanOrEqual(10)
    expect(loaded[loaded.length - 1].text).toBe('Message content 14')
  })
})
