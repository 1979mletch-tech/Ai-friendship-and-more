import{describe,expect,it}from'vitest';import{redactDiagnosticFields}from'./diagnosticRedaction'
describe('diagnostic redaction',()=>{it('drops conversation and credential material',()=>expect(redactDiagnosticFields({route:'/chat',password:'p',accessToken:'t',messageText:'private',status:500})).toEqual({route:'/chat',status:500}))})
