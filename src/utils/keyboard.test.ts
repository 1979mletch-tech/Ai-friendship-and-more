import { describe,expect,it } from 'vitest'
import { escapeClearsDraft,shouldSendOnKey } from './keyboard'
describe('keyboard behavior',()=>{it('sends enter',()=>expect(shouldSendOnKey('Enter',false)).toBe(true));it('keeps shift-enter',()=>expect(shouldSendOnKey('Enter',true)).toBe(false));it('respects IME composition',()=>expect(shouldSendOnKey('Enter',false,true)).toBe(false));it('recognizes escape',()=>expect(escapeClearsDraft('Escape')).toBe(true))})
