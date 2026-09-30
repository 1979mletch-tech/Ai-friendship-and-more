import { describe, expect, it } from 'vitest'
import { routeRequiresAdultGate } from './adultRoutes'

describe('adult-only interactive routes', () => {
  it.each(['/chat','/history','/memory','/settings','/account','/immersive'])('gates %s', (route) => {
    expect(routeRequiresAdultGate(route)).toBe(true)
  })
  it('keeps public information routes readable', () => {
    expect(routeRequiresAdultGate('/')).toBe(false)
    expect(routeRequiresAdultGate('/pricing')).toBe(false)
    expect(routeRequiresAdultGate('/privacy')).toBe(false)
  })
})
