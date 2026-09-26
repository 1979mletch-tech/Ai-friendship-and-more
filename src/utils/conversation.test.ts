import { describe, expect, it } from 'vitest'
import { matchesConversationSearch, renameConversation } from './conversation'

describe('conversation helpers', () => {
  it('sanitizes names', () => {
    expect(renameConversation(' <My   ideas> ')).toBe('My ideas')
  })
  it('searches transcript case-insensitively', () => {
    const messages = [{ id:'1', role:'user' as const, text:'My Blue Painting', createdAt:'x', dayKey:'x' }]
    expect(matchesConversationSearch(messages, 'blue')).toBe(true)
    expect(matchesConversationSearch(messages, 'green')).toBe(false)
  })
})
