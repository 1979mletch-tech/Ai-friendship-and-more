import { describe,expect,it } from 'vitest'
import { canRetryStatus,retryDelayMs } from './retry'
describe('retry policy',()=>{it('backs off',()=>expect(retryDelayMs(3)).toBe(4000));it('caps delay',()=>expect(retryDelayMs(20)).toBe(8000));it('retries transient status',()=>expect(canRetryStatus(503)).toBe(true));it('does not retry bad auth',()=>expect(canRetryStatus(401)).toBe(false))})
