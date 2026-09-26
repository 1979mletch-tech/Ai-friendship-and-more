import{describe,expect,it}from'vitest';import{hasForbiddenExportKeys}from'./exportPolicy'
describe('export policy',()=>{it('detects credential-shaped fields recursively',()=>{expect(hasForbiddenExportKeys({profile:{name:'A'},conversations:[]})).toBe(false);expect(hasForbiddenExportKeys({user:{accessToken:'x'}})).toBe(true)})})
