import { describe,expect,it } from 'vitest'
import { normalizePlan,previewPlanWarning,trustedEntitlementRequired } from './planGuard'
describe('plan guard',()=>{it('defaults unknown plans free',()=>expect(normalizePlan('admin')).toBe('free'));it('marks paid plans server-trust required',()=>expect(trustedEntitlementRequired('pro-monthly')).toBe(true));it('labels preview paid selection',()=>expect(previewPlanWarning('pro-annual')).toContain('server-side'));it('keeps free quiet',()=>expect(previewPlanWarning('free')).toBe(''))})
