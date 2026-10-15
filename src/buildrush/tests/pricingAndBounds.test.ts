import { describe, it, expect } from 'vitest'
import {
  UK_TRADE_GUIDANCE,
  PRICING_DISCLAIMER,
  getPriceGuidanceForTrade,
  getTradeCategoryGuidance,
} from '../config/pricingGuidance'

describe('BuildRush UK Pricing Guidance & Boundaries Tests', () => {
  it('has comprehensive UK trade guidance config keys', () => {
    expect(Object.keys(UK_TRADE_GUIDANCE).length).toBeGreaterThanOrEqual(8)
  })

  it('covers all core UK trades with grounded benchmarks between £40 and £120/hr', () => {
    const trades = ['plumbing', 'electrical', 'roofing', 'carpentry', 'plastering', 'painting', 'locksmith', 'general']
    for (const t of trades) {
      const guidance = getPriceGuidanceForTrade(t)
      expect(guidance).not.toBeNull()
      expect(guidance!.typicalHourlyMin).toBeGreaterThanOrEqual(35)
      expect(guidance!.typicalHourlyMax).toBeLessThanOrEqual(130)
      expect(guidance!.typicalHourlyMin).toBeLessThan(guidance!.typicalHourlyMax)
    }
  })

  it('provides emergency call-out benchmarks higher than standard hourly rate', () => {
    const plumbing = getPriceGuidanceForTrade('plumbing')!
    expect(plumbing.emergencyCalloutMin).toBeGreaterThanOrEqual(plumbing.typicalHourlyMin)
    expect(plumbing.emergencyCalloutMax).toBeGreaterThanOrEqual(plumbing.typicalHourlyMax)

    const locksmith = getPriceGuidanceForTrade('locksmith')!
    expect(locksmith.emergencyCalloutMin).toBeGreaterThanOrEqual(90)
  })

  it('includes the mandatory non-guarantee disclaimer in all guidance outputs', () => {
    expect(PRICING_DISCLAIMER).toContain('advisory only')
    expect(PRICING_DISCLAIMER).toContain('Customers set their proposed budget')
    expect(PRICING_DISCLAIMER).toContain('tradespeople quote independently')
    expect(PRICING_DISCLAIMER).toContain('does not guarantee job completion timing or fixed prices')
  })

  it('correctly formats trade category guidance helper with fallback for unknown trades', () => {
    const valid = getTradeCategoryGuidance('electrical')
    expect(valid.displayName).toBe('Electrical')
    expect(valid.typicalHourlyMin).toBe(45)

    const unknown = getTradeCategoryGuidance('nuclear_reactor_repair')
    expect(unknown.displayName).toBe('General Repair')
    expect(unknown.typicalHourlyMin).toBe(40)
  })
})
