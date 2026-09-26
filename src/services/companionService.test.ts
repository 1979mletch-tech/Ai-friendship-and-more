import { describe, expect, it } from 'vitest'
import { createCompanionReply } from './companionService'

describe('companion service', () => {
  it('routes crisis text through safety before normal companion chat', () => {
    expect(createCompanionReply('I want to die tonight', 'general')).toMatch(/local emergency service/i)
  })
  it('does not encourage exclusive dependency', () => {
    expect(createCompanionReply("You're the only friend I need", 'general')).toMatch(/should not replace people/i)
  })
  it('provides normal companion conversation otherwise', () => {
    expect(createCompanionReply('I had a difficult day', 'general')).toMatch(/talk|piece/i)
  })
})
