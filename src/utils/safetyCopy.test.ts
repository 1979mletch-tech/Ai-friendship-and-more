import { describe, expect, it } from 'vitest'
import { crisisSupportCopy, dependencyBoundaryCopy } from './safetyCopy'

describe('safety copy', () => {
  it('uses region-neutral emergency wording', () => {
    expect(crisisSupportCopy.immediate).toMatch(/local emergency service/i)
  })
  it('rejects exclusivity', () => {
    expect(dependencyBoundaryCopy).toMatch(/only source of support/i)
  })
})
