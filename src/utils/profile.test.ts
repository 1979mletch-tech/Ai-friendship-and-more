import { describe, expect, it } from 'vitest'
import { sanitizeProfile } from './profile'
describe('profile sanitizer', () => {
  it('bounds and sanitizes preferences', () => {
    const p=sanitizeProfile({companionName:'<Buddy>',tone:'bad',interests:'x'.repeat(600),memoryEnabled:false})
    expect(p.companionName).toBe('Buddy'); expect(p.tone).toBe('warm'); expect(p.interests).toHaveLength(500); expect(p.memoryEnabled).toBe(false)
  })
})
