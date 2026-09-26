import { describe, expect, it } from 'vitest'
import { removeConversation, upsertConversation } from './conversationStore'
describe('conversation store', () => {
 it('isolates updates by conversation id', () => {
  const first={id:'a',title:'A',updatedAt:'2026-01-01',messages:['one']}
  const second={id:'b',title:'B',updatedAt:'2026-01-02',messages:['two']}
  const updated=upsertConversation([first,second],{...first,updatedAt:'2026-01-03',messages:['one','three']})
  expect(updated.find(x=>x.id==='b')?.messages).toEqual(['two'])
 })
 it('deletes only the selected conversation',()=>expect(removeConversation([{id:'a',title:'A',updatedAt:'1',messages:[]},{id:'b',title:'B',updatedAt:'2',messages:[]}],'a').map(x=>x.id)).toEqual(['b']))
})
