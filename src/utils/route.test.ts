import { describe, expect, it } from 'vitest'
import { safeHashPath } from './route'

describe('route guard', () => {
  it('accepts known paths', () => expect(safeHashPath('#/memory')).toBe('/memory'))
  it('falls back from unknown paths', () => expect(safeHashPath('#/admin-secret')).toBe('/'))
})
