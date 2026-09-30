import { describe,expect,it } from 'vitest'
import { chatViewportHeight,comfortableTapTarget,isNarrowViewport } from './mobile'
describe('mobile helpers',()=>{it('detects narrow phone',()=>expect(isNarrowViewport(390)).toBe(true));it('requires 44px tap target',()=>expect(comfortableTapTarget(44,44)).toBe(true));it('rejects small tap target',()=>expect(comfortableTapTarget(43,44)).toBe(false));it('keeps chat usable',()=>expect(chatViewportHeight(400)).toBe(220))})
