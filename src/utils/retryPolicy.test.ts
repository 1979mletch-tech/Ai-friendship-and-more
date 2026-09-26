import{describe,expect,it}from'vitest';import{retryDecision}from'./retryPolicy'
describe('retry policy',()=>{it('retries transient failures',()=>expect(retryDecision(503,0)).toEqual({retry:true,delayMs:500}));it('does not retry auth failures',()=>expect(retryDecision(401,0).retry).toBe(false));it('caps attempts',()=>expect(retryDecision(503,3).retry).toBe(false))})
