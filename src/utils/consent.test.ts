import { describe,expect,it } from 'vitest'
import { CONSENT_VERSION,consentCurrent,createConsentRecord } from './consent'
describe('consent record',()=>{it('versions acceptance',()=>expect(createConsentRecord(true,new Date('2026-09-26')).version).toBe(CONSENT_VERSION));it('requires current version',()=>expect(consentCurrent({accepted:true,version:'old'})).toBe(false));it('accepts current',()=>expect(consentCurrent(createConsentRecord(true))).toBe(true))})
