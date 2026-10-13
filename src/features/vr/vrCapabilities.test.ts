import { afterEach, describe, expect, it, vi } from 'vitest'
import { getVrCapabilities } from './vrCapabilities'

afterEach(() => vi.unstubAllGlobals())

describe('Quest VR capability detection', () => {
  it('fails safely when no browser is present', async () => {
    vi.stubGlobal('navigator', undefined)
    expect(await getVrCapabilities()).toEqual({ secure: false, immersive: false, handTrackingRequested: false })
  })
  it('does not claim immersive VR when WebXR is missing', async () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('window', { isSecureContext: true })
    expect((await getVrCapabilities()).immersive).toBe(false)
  })
  it('handles headset support-check failures', async () => {
    vi.stubGlobal('navigator', { xr: { isSessionSupported: async () => { throw new Error('denied') } } })
    vi.stubGlobal('window', { isSecureContext: true })
    expect((await getVrCapabilities()).immersive).toBe(false)
  })
  it('reports a supported immersive headset', async () => {
    vi.stubGlobal('navigator', { xr: { isSessionSupported: async () => true } })
    vi.stubGlobal('window', { isSecureContext: true })
    expect((await getVrCapabilities()).immersive).toBe(true)
  })
})
