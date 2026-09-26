import { describe, expect, it } from 'vitest'
import { countUserMessagesForDay, remainingMessages } from './usage'

describe('usage helpers', () => {
  const messages = [
    { id:'1', role:'user' as const, text:'a', createdAt:'x', dayKey:'2026-09-26' },
    { id:'2', role:'assistant' as const, text:'b', createdAt:'x', dayKey:'2026-09-26' },
  ]
  it('counts user messages only', () => expect(countUserMessagesForDay(messages, '2026-09-26')).toBe(1))
  it('never returns negative remaining usage', () => expect(remainingMessages(12, 10)).toBe(0))
})
