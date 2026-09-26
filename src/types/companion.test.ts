import { describe, expect, it } from 'vitest'
import { conversationTitle, sanitizeConversations } from './companion'

describe('companion data helpers', () => {
  it('creates bounded conversation titles', () => {
    expect(conversationTitle('  hello   creative world ')).toBe('hello creative world')
    expect(conversationTitle('x'.repeat(80)).length).toBeLessThanOrEqual(44)
  })

  it('rejects malformed persisted conversations', () => {
    expect(sanitizeConversations(null)).toEqual([])
    expect(sanitizeConversations([{ id: 'bad' }])).toEqual([])
  })

  it('accepts a valid persisted conversation', () => {
    const value = [{
      id: 'c1', title: 'Hello', mode: 'general',
      messages: [{ id: 'm1', role: 'user', text: 'Hi', createdAt: '2026-01-01T00:00:00Z', dayKey: '2026-01-01' }],
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    }]
    expect(sanitizeConversations(value)).toHaveLength(1)
  })
})
