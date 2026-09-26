import { describe, expect, it } from 'vitest'
import { mergeUniqueMemory, syncStatusCopy } from './sync'

describe('sync helpers', () => {
  it('merges memory case-insensitively without duplicates', () => {
    expect(mergeUniqueMemory(['Novel', 'music'], ['novel', 'Film'])).toEqual(['Novel', 'Film', 'music'])
  })
  it('provides honest status copy', () => {
    expect(syncStatusCopy('error')).toContain('local copy is unchanged')
    expect(syncStatusCopy('idle')).toBe('')
  })
})
