import{describe,expect,it}from'vitest';import{createAuditRecord,safeAuditFields}from'./audit'
describe('audit metadata',()=>{it('contains no message or memory content fields',()=>{const r=safeAuditFields(createAuditRecord('memory.delete','m1'));expect(Object.keys(r).sort()).toEqual(['at','event','subjectId']);expect(JSON.stringify(r)).not.toMatch(/password|token|messageText/)})})
