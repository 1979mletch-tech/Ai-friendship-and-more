import { describe, expect, it } from 'vitest'
import { containsPrivateQueryKey } from './privacy'

describe('privacy URL guard', () => {
  it('flags private content in query parameters', () => {
    expect(containsPrivateQueryKey('/chat?message=secret')).toBe(true)
    expect(containsPrivateQueryKey('/reset?token=abc')).toBe(true)
  })
  it('allows ordinary navigation URLs', () => {
    expect(containsPrivateQueryKey('/chat#today')).toBe(false)
  })
})
