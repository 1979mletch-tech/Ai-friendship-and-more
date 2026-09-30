import { describe, expect, it } from 'vitest'
import { currentNetworkState, networkCopy } from './network'

describe('network state', () => {
  it('reports offline mode without overstating failure', () => {
    expect(currentNetworkState(false)).toBe('offline')
    expect(networkCopy('offline')).toContain('Local features still work')
  })
  it('stays quiet while online', () => expect(networkCopy('online')).toBe(''))
})
