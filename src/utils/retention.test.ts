import{describe,expect,it}from'vitest';import{DEFAULT_RETENTION,expiresAt}from'./retention'
describe('retention',()=>{it('defaults deleted-account grace to zero',()=>expect(DEFAULT_RETENTION.deletedAccountGraceDays).toBe(0));it('computes expiry',()=>expect(expiresAt('2026-01-01T00:00:00.000Z',1)).toBe('2026-01-02T00:00:00.000Z'))})
