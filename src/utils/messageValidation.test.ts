import{describe,expect,it}from'vitest';import{MAX_MESSAGE_LENGTH,validateMessage}from'./messageValidation'
describe('message validation',()=>{it('rejects blank and oversized messages',()=>{expect(validateMessage('   ')).toBeTruthy();expect(validateMessage('x'.repeat(MAX_MESSAGE_LENGTH+1))).toBeTruthy();expect(validateMessage('hello')).toBeNull()})})
