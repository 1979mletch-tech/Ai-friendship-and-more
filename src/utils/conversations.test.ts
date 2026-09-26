import { describe, expect, it } from 'vitest'
import { normalizeConversations, searchConversations, titleFromMessage } from './conversations'

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

  it('finds a conversation by title or message text without changing its order', () => {
    const data = normalizeConversations([
      { id: '1', title: 'Songs', updatedAt: '2026-01-01', messages: [{ id: 'a', role: 'user', text: 'Piano ideas' }] },
      { id: '2', title: 'Journal', updatedAt: '2026-01-02', messages: [{ id: 'b', role: 'user', text: 'A walk' }] },
    ])
    expect(searchConversations(data, 'PIANO').map((item) => item.id)).toEqual(['1'])
    expect(searchConversations(data, 'journal').map((item) => item.id)).toEqual(['2'])
    expect(searchConversations(data, '').map((item) => item.id)).toEqual(['1', '2'])
  })
})
