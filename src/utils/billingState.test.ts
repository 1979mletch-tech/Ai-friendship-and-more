import{describe,expect,it}from'vitest';import{billingStateLabel}from'./billingState'
describe('billing state',()=>{it('does not imply a verified plan while loading or failed',()=>{expect(billingStateLabel('loading')).toContain('Checking');expect(billingStateLabel('error')).toContain('unavailable');expect(billingStateLabel('loaded')).toContain('verified')})})
