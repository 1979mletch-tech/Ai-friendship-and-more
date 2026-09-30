import { describe,expect,it } from 'vitest'
import { deleteResultOk,deletionFailureCopy } from './cloudDelete'
describe('cloud delete',()=>{it('requires success status',()=>expect(deleteResultOk(500,{})).toBe(false));it('requires response body',()=>expect(deleteResultOk(200,null)).toBe(false));it('preserves local data on failure copy',()=>expect(deletionFailureCopy(true)).toContain('kept'))})
