import { describe, expect, it } from 'vitest'
import { retainRecent } from './retention'
describe('retention helpers', () => {
  it('removes old timestamped items', () => {
    const now = Date.parse('2026-09-26T00:00:00Z')
    expect(retainRecent([{createdAt:'2026-09-25T00:00:00Z'},{createdAt:'2026-01-01T00:00:00Z'}],30,now)).toHaveLength(1)
  })
})
