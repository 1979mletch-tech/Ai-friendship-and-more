import { describe, expect, it } from 'vitest'
import { ChatRequestGate } from './chatRequestGate'

describe('chat request gate', () => {
  it('prevents duplicate sends while the current request is running', () => {
    const gate = new ChatRequestGate()
    const first = gate.begin()
    expect(first).not.toBeNull()
    expect(gate.begin()).toBeNull()
    gate.finish(first!)
    expect(gate.begin()).not.toBeNull()
  })

  it('discards an old reply after account switch or history deletion', () => {
    const gate = new ChatRequestGate()
    const old = gate.begin()!
    gate.invalidate()
    expect(gate.isCurrent(old)).toBe(false)
    const next = gate.begin()!
    gate.finish(old)
    expect(gate.begin()).toBeNull()
    gate.finish(next)
    expect(gate.begin()).not.toBeNull()
  })
})
