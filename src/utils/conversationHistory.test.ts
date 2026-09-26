import { describe, expect, it } from 'vitest'
import { makeConversationTitle, sortConversations } from './conversationHistory'

describe('conversation history helpers', () => {
  it('creates compact titles without inventing content', () => {
    expect(makeConversationTitle('  A difficult day at work  ')).toBe('A difficult day at work')
    expect(makeConversationTitle('')).toBe('New conversation')
  })
  it('orders recent conversations first', () => {
    const sorted = sortConversations([
      { id: '1', title: 'Older', updatedAt: '2026-01-01T00:00:00Z' },
      { id: '2', title: 'Newer', updatedAt: '2026-02-01T00:00:00Z' },
    ])
    expect(sorted[0].id).toBe('2')
  })
})
