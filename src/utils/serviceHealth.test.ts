import{describe,expect,it}from'vitest';import{serviceHealth,serviceHealthLabel}from'./serviceHealth'
describe('service health',()=>{it('describes offline mode without claiming sync',()=>{expect(serviceHealth(false)).toBe('offline');expect(serviceHealthLabel('offline')).toContain('local')})})
