import { describe,expect,it } from 'vitest'
import { headerNames,recommendedSecurityHeaders } from './securityHeaders'
describe('security header policy',()=>{it('disables sniffing',()=>expect(recommendedSecurityHeaders()['X-Content-Type-Options']).toBe('nosniff'));it('disables unused permissions',()=>expect(recommendedSecurityHeaders()['Permissions-Policy']).toContain('camera=()'));it('declares four baseline headers',()=>expect(headerNames()).toHaveLength(4))})
