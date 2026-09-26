import { describe, expect, it } from 'vitest'
import { applyProjectNotesLimit, getEntitlements, isProPlan, plans } from './entitlements'

describe('entitlements', () => {
  it('returns constrained starter limits', () => {
    const free = getEntitlements('free')
    expect(free.usageLimits.dailyMessages).toBe(10)
    expect(free.canUseLongHistory).toBe(false)
  })

  it('returns expanded plus limits', () => {
    const pro = getEntitlements('pro-monthly')
    expect(pro.usageLimits.dailyMessages).toBeGreaterThan(10)
    expect(pro.canUseAdvancedPersonalization).toBe(true)
    expect(isProPlan('pro-annual')).toBe(true)
  })

  it('marks paid plans as proposed pricing copy', () => {
    const proposedPaid = plans.filter((p) => p.id !== 'free').every((p) => p.proposed)
    expect(proposedPaid).toBe(true)
  })

  it('trims stored items when downgraded to starter', () => {
    const notes = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }))
    const freeNotes = applyProjectNotesLimit(notes, 'free')
    expect(freeNotes).toHaveLength(5)
  })
})
