import { describe, expect, it } from 'vitest'
import { validateBackupPayload } from './backup'

describe('backup validation', () => {
  it('rejects unrelated or malformed JSON', () => {
    expect(validateBackupPayload(null)).toBe(false)
    expect(validateBackupPayload({ product:'Other' })).toBe(false)
  })
  it('accepts the export envelope shape', () => {
    expect(validateBackupPayload({ product:'AI Friendship', exportedAt:'now', messages:[], memory:[], projectNotes:[] })).toBe(true)
  })
})
