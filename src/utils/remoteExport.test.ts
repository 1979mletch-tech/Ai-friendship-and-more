import{describe,expect,it}from'vitest';import{normalizeRemoteExport}from'./remoteExport'
describe('remote export',()=>{it('keeps server sections at their correct level',()=>{expect(normalizeRemoteExport({conversations:['c'],memories:['m']},{name:'F'},[])).toEqual({companion:{name:'F'},conversations:['c'],memories:['m']})})})
