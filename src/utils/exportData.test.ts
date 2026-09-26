import { describe, expect, it } from 'vitest'
import { createExportBundle } from './exportData'

describe('data export', () => {
  it('creates a clearly labelled user export', () => {
    const result = createExportBundle({ messages: [], memory: ['novel'], projectNotes: [], companionName: 'Nova' })
    expect(result.product).toBe('AI Friendship')
    expect(result.memory).toEqual(['novel'])
    expect(result.exportedAt).toBeTruthy()
  })
})
