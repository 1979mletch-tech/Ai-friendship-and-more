import { describe,expect,it } from 'vitest'
import { boundedCompanionName,boundedMessages,chatPayload } from './cloudPayload'
describe('cloud payload',()=>{it('bounds transcript to 24',()=>expect(boundedMessages(Array.from({length:30},()=>({role:'user' as const,text:'x'})))).toHaveLength(24));it('drops blank messages',()=>expect(boundedMessages([{role:'user',text:' '}])).toHaveLength(0));it('sanitizes name',()=>expect(boundedCompanionName('<Nova>')).toBe('Nova'));it('defaults invalid mode',()=>expect(chatPayload([{role:'user',text:'hi'}],'admin','Friend').mode).toBe('general'))})
