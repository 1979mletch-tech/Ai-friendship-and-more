import { describe, expect, it } from 'vitest'
import { createOwnerWorkspaceExport, defaultOwnerProjects, sanitizeOwnerMessages, sanitizeOwnerNotes, sanitizeOwnerProjects } from './ownerWorkspace'

describe('Owner Aurora workspace', () => {
  it('drops malformed messages and bounds retained history', () => {
    const input = [
      null,
      { id: 'x', role: 'system', text: 'nope' },
      ...Array.from({ length: 70 }, (_, index) => ({ id: `m${index}`, role: index % 2 ? 'assistant' : 'user', text: `message ${index}`, createdAt: 'now' })),
    ]
    const result = sanitizeOwnerMessages(input)
    expect(result).toHaveLength(60)
    expect(result[0]?.id).toBe('m10')
  })

  it('deduplicates and bounds private owner notes', () => {
    const result = sanitizeOwnerNotes(['  launch today  ', 'launch today', 'x'.repeat(400), 123, null])
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('launch today')
    expect(result[1]).toHaveLength(280)
  })

  it('creates an owner-only export envelope', () => {
    const bundle = createOwnerWorkspaceExport([
      { id: '1', role: 'user', text: 'review launch', createdAt: 'now' },
    ], ['owner note'], [{ id: 'ai-friendship', name: 'AI Friendship', status: 'active', summary: 'launch work' }])
    expect(bundle.workspace).toBe('Owner Aurora')
    expect(bundle.messages).toHaveLength(1)
    expect(bundle.notes).toEqual(['owner note'])
    expect(bundle.projects).toEqual([{ id: 'ai-friendship', name: 'AI Friendship', status: 'active', summary: 'launch work' }])
  })
  it('keeps Owner Aurora project state bounded to approved projects', () => {
    const result = sanitizeOwnerProjects([
      { id: 'ai-friendship', name: 'AI Friendship', status: 'active', summary: 'launch work' },
      { id: 'unknown', name: 'Secret project', status: 'active', summary: 'no' },
      { id: 'ai-doctor', name: 'AI Doctor', status: 'next', summary: 'verify repo first' },
      { id: 'ai-doctor', name: 'duplicate', status: 'active', summary: 'no' },
    ])
    expect(result).toHaveLength(2)
    expect(result.map((project) => project.id)).toEqual(['ai-friendship', 'ai-doctor'])
    expect(defaultOwnerProjects()[1]?.status).toBe('next')
  })
})
