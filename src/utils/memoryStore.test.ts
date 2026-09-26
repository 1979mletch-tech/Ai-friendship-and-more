import { describe, expect, it, vi } from 'vitest'
import { removeMemory, sanitizeMemory } from './memoryStore'
describe('memory store',()=>{
 it('bounds user-approved memory',()=>{vi.stubGlobal('crypto',{randomUUID:()=> 'id'}); const m=sanitizeMemory('x'.repeat(100),'y'.repeat(700)); expect(m.label).toHaveLength(60); expect(m.value).toHaveLength(500); vi.unstubAllGlobals()})
 it('forgets exactly one item',()=>expect(removeMemory([{id:'1',label:'a',value:'a',createdAt:''},{id:'2',label:'b',value:'b',createdAt:''}],'1').map(x=>x.id)).toEqual(['2']))
})
