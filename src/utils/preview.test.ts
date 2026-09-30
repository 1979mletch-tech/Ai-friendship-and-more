import { describe, expect, it } from 'vitest'
import { previewNotice, shouldUseSyntheticData } from './preview'

describe('preview labels', () => {
  it('distinguishes cloud and local preview states', () => {
    expect(previewNotice(true)).toContain('STAGING PREVIEW')
    expect(previewNotice(false)).toContain('LOCAL PREVIEW')
  })
  it('marks hosted previews for synthetic data', () => {
    expect(shouldUseSyntheticData('example.github.io')).toBe(true)
    expect(shouldUseSyntheticData('localhost')).toBe(false)
  })
})
