import { describe, expect, it } from 'vitest'
import { applyProjectNotesLimit, getEntitlements, isProPlan, plans } from './entitlements'

describe('entitlements', () => {
  it('returns the ten-message free allowance', () => {
    const free = getEntitlements('free')
    expect(free.usageLimits.dailyMessages).toBe(10)
    expect(free.canUseLongHistory).toBe(false)
  })

  it('returns expanded paid limits for every paid duration', () => {
    for (const planId of ['pro-daily', 'pro-weekly', 'pro-monthly', 'pro-annual'] as const) {
      const pro = getEntitlements(planId)
      expect(pro.usageLimits.dailyMessages).toBe(250)
      expect(pro.canUseAdvancedPersonalization).toBe(true)
      expect(isProPlan(planId)).toBe(true)
    }
  })

  it('publishes exact live GBP pricing instead of proposed copy', () => {
    expect(plans.map(({ id, priceLabel, proposed }) => ({ id, priceLabel, proposed }))).toEqual([
      { id: 'free', priceLabel: 'First 10 messages free', proposed: false },
      { id: 'pro-daily', priceLabel: '£4 / day', proposed: false },
      { id: 'pro-weekly', priceLabel: '£12 / week', proposed: false },
      { id: 'pro-monthly', priceLabel: '£20 / month', proposed: false },
      { id: 'pro-annual', priceLabel: '£90 / year', proposed: false },
    ])
  })

  it('trims project notes when downgraded to free', () => {
    const notes = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }))
    const freeNotes = applyProjectNotesLimit(notes, 'free')
    expect(freeNotes).toHaveLength(3)
  })
})
