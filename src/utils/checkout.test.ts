import { describe, expect, it } from 'vitest'
import { checkoutUnavailableCopy, isPaidPlan } from './checkout'
describe('checkout preview',()=>{it('never implies preview payment',()=>expect(checkoutUnavailableCopy('pro-monthly')).toContain('No payment has been taken'));it('recognizes free plan',()=>expect(isPaidPlan('free')).toBe(false))})
