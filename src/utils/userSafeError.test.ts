import{describe,expect,it}from'vitest';import{userSafeError}from'./userSafeError'
describe('safe errors',()=>{it('gives useful timeout and network messages',()=>{expect(userSafeError(new DOMException('x','AbortError'))).toContain('too long');expect(userSafeError(new TypeError('fetch failed'))).toContain('connection')})})
