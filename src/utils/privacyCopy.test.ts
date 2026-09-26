import{describe,expect,it}from'vitest';import{privacyDeleteLabel,privacyScopeText}from'./privacyCopy'
describe('privacy copy',()=>{it('does not call server deletion local-only',()=>{expect(privacyDeleteLabel(true,false)).toContain('account');expect(privacyDeleteLabel(false,false)).toContain('local');expect(privacyScopeText(true)).toContain('signed-in account')})})
