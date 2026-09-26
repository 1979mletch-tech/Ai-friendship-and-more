import { describe,expect,it } from 'vitest'
import { dedupeMemory,memoryAllowed,normalizeMemory } from './memoryPolicy'
describe('memory policy',()=>{it('honors disabled memory',()=>expect(memoryAllowed(false,'novel')).toBe(false));it('rejects blank memory',()=>expect(memoryAllowed(true,' ')).toBe(false));it('normalizes whitespace',()=>expect(normalizeMemory(' a   b ')).toBe('a b'));it('deduplicates case-insensitively',()=>expect(dedupeMemory(['Novel','novel','Music'])).toEqual(['novel','Music']));it('bounds list',()=>expect(dedupeMemory(['a','b','c'],2)).toEqual(['b','c']))})
