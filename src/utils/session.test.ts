import { describe, expect, it } from 'vitest'
import { sessionIsExpired, sessionNeedsRefresh } from './session'
describe('session timing',()=>{it('refreshes near expiry',()=>expect(sessionNeedsRefresh(150000,100000)).toBe(true));it('detects expiry',()=>expect(sessionIsExpired(999,1000)).toBe(true))})
