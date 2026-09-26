import{describe,expect,it}from'vitest';import{accountScopeKey}from'./accountScope'
describe('account scope',()=>{it('namespaces cached account data by authenticated user',()=>{expect(accountScopeKey('user/a','memories')).toContain('user%2Fa');expect(accountScopeKey('a','memories')).not.toBe(accountScopeKey('b','memories'))})})
