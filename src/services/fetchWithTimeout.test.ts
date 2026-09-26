import{describe,expect,it,vi}from'vitest';import{fetchWithTimeout}from'./fetchWithTimeout'
describe('fetch timeout',()=>{it('passes an abort signal to fetch',async()=>{const f=vi.fn().mockResolvedValue({ok:true});vi.stubGlobal('fetch',f);await fetchWithTimeout('/x',{},100);expect(f.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);vi.unstubAllGlobals()})})
