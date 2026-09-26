import {describe,expect,it} from 'vitest'; import {canSubmit,failure,loading,success} from './requestState'
describe('request state',()=>{it('blocks duplicate submits while loading',()=>expect(canSubmit(loading())).toBe(false));it('preserves success/error state',()=>{expect(success('ok').data).toBe('ok');expect(failure('bad').error).toBe('bad')})})
