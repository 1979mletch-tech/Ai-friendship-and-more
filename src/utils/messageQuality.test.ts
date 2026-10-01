import { describe,expect,it } from 'vitest'
import { canSendMessage,normalizeMessage,transcriptWindow } from './messageQuality'
describe('message quality',()=>{it('normalizes and bounds input',()=>expect(normalizeMessage('  a   b  ')).toBe('a b'));it('blocks without consent',()=>expect(canSendMessage('hi',false,false,0,25)).toBe(false));it('blocks at quota',()=>expect(canSendMessage('hi',true,false,25,25)).toBe(false));it('blocks double send',()=>expect(canSendMessage('hi',true,true,0,25)).toBe(false));it('bounds transcript',()=>expect(transcriptWindow([1,2,3],2)).toEqual([2,3]))})
