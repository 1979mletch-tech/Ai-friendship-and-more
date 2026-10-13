import { describe, expect, it } from 'vitest'
import { canAnimateGesture, chooseSupportTone, gesturePrompt } from './affection'

describe('companion comfort interactions', () => {
  it('requires explicit consent to animate any gesture', () => {
    expect(canAnimateGesture('offered', true)).toBe(false)
    expect(canAnimateGesture('accepted', false)).toBe(false)
    expect(canAnimateGesture('accepted', true)).toBe(true)
  })
  it('never forces cheerfulness on someone distressed', () => {
    expect(chooseSupportTone(false, true)).toBe('gentle')
    expect(chooseSupportTone(true, false)).toBe('gentle')
    expect(chooseSupportTone(false, false)).toBe('bright')
  })
  it('offers rather than assumes contact', () => {
    expect(gesturePrompt('hug')).toMatch(/would you like/i)
    expect(gesturePrompt('hand')).toMatch(/would you like/i)
    expect(gesturePrompt('pat')).toMatch(/would/i)
  })
})
