import { describe, expect, it } from 'vitest'
import { addMemoryItem, removeMemoryItem } from './memory'

describe('memory controls', () => {
  it('deduplicates case-insensitively', () => {
    expect(addMemoryItem(['My novel'], 'my novel')).toEqual(['my novel'])
  })
  it('bounds item count', () => {
    expect(addMemoryItem(['a','b'], 'c', 2)).toEqual(['b','c'])
  })
  it('removes only selected item', () => {
    expect(removeMemoryItem(['a','b'], 'a')).toEqual(['b'])
  })
})
