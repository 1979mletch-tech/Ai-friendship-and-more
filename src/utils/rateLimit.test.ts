import{describe,expect,it}from'vitest';import{consumeUsage}from'./rateLimit'
describe('rate limit helper',()=>{it('blocks after limit',()=>{let w;for(let i=0;i<3;i++)w=consumeUsage(w,100,3,1000).next;expect(consumeUsage(w,100,3,1000).allowed).toBe(false)});it('resets after window',()=>expect(consumeUsage({startedAt:0,count:99},2000,3,1000).allowed).toBe(true))})
