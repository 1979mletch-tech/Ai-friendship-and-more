import { describe, expect, it } from 'vitest'
import { serializeLocalData } from './export'

describe('local export', () => {
  it('includes the actual conversation and note data with a format version', () => {
    const exportData = JSON.parse(serializeLocalData({
      companionName: 'Nova',
      conversations: [{ id: 'c1', title: 'Hi', updatedAt: '2026-01-01', messages: [{ id: 'm1', role: 'user', text: 'Hello' }] }],
      projectNotes: [{ id: 'n1', project: 'Song', tags: 'draft', note: 'Chorus' }],
    }))
    expect(exportData.format).toBe('ai-friendship-local-export-v1')
    expect(exportData.conversations[0].messages[0].text).toBe('Hello')
    expect(exportData.projectNotes[0].note).toBe('Chorus')
  })
})
