import { describe,expect,it } from 'vitest'
import { normalizeEmailAddress,passwordLengthOk,validEmailAddress } from './accountValidation'
describe('account validation',()=>{it('normalizes email',()=>expect(normalizeEmailAddress(' A@B.COM ')).toBe('a@b.com'));it('rejects malformed email',()=>expect(validEmailAddress('a@b')).toBe(false));it('accepts normal email',()=>expect(validEmailAddress('a@b.com')).toBe(true));it('bounds passwords',()=>{expect(passwordLengthOk('1234567')).toBe(false);expect(passwordLengthOk('12345678')).toBe(true);expect(passwordLengthOk('x'.repeat(129))).toBe(false)})})
