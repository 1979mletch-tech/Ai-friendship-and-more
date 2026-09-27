import { describe, expect, it } from 'vitest'
import { readMessages, readNotes } from './chatData'

describe('saved local data', () => {
  it('ignores malformed, oversized, and unrelated message records', () => {
    const valid = { id: '1', role: 'user', text: 'Hello', createdAt: '2026-09-27T10:00:00Z', dayKey: '2026-09-27' }
    expect(readMessages([null, valid, { ...valid, role: 'admin' }, { ...valid, text: 'x'.repeat(2001) }, { ...valid, createdAt: 'invalid' }])).toEqual([valid])
    expect(readMessages({ messages: [valid] })).toEqual([])
  })

  it('ignores invalid notes rather than rendering corrupted storage', () => {
    const valid = { id: '1', project: 'Book', tags: 'draft', note: 'Chapter one' }
    expect(readNotes([valid, { ...valid, note: 'x'.repeat(1001) }, { ...valid, project: 4 }])).toEqual([valid])
  })
})
