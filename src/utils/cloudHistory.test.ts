import { describe, expect, it } from 'vitest'
import { conversationMatches, normalizeConversationTitle, summarizeConversation } from './cloudHistory'

describe('cloud history helpers', () => {
  it('sanitizes and bounds titles', () => {
    expect(normalizeConversationTitle('  <My>   chat ')).toBe('My chat')
    expect(normalizeConversationTitle('x'.repeat(140))).toHaveLength(120)
  })
  it('searches titles and transcript text', () => {
    expect(conversationMatches('Studio', [{ text: 'hello' }], 'studio')).toBe(true)
    expect(conversationMatches('Chat', [{ text: 'Song idea' }], 'song')).toBe(true)
    expect(conversationMatches('Chat', [{ text: 'hello' }], 'missing')).toBe(false)
  })
  it('summarizes rows', () => {
    expect(summarizeConversation({ id: '1', title: 'A', mode: 'general', messages: [{}, {}], updated_at: 'now' })).toEqual({
      id: '1', title: 'A', mode: 'general', messageCount: 2, updatedAt: 'now',
    })
  })
})
