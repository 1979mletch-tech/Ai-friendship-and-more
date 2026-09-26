import { describe, expect, it } from 'vitest'
import { normalizeConversations, titleFromMessage } from './conversations'

describe('conversation persistence', () => {
  it('rejects malformed saved conversations while preserving valid ones', () => {
    expect(normalizeConversations([
      { id: 'bad', title: 'Invalid', updatedAt: 'today', messages: [{ role: 'user' }] },
      { id: 'good', title: 'A chat', updatedAt: '2026-01-01', messages: [{ id: 'm1', role: 'user', text: 'Hello' }] },
    ])).toHaveLength(1)
    expect(normalizeConversations(null)).toEqual([])
  })

  it('uses a short first-message title', () => {
    expect(titleFromMessage('  Hello there  ')).toBe('Hello there')
    expect(titleFromMessage('x'.repeat(100))).toHaveLength(48)
  })
})
