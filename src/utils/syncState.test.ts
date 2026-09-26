import{describe,expect,it}from'vitest';import{canTrustRemoteState,syncLabel}from'./syncState'
describe('sync state',()=>{it('never labels failed sync as trusted',()=>{expect(canTrustRemoteState('error')).toBe(false);expect(syncLabel('error')).toContain('unavailable');expect(canTrustRemoteState('synced')).toBe(true)})})
