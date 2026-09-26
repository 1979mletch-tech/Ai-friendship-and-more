import { describe,expect,it } from 'vitest'
import { matchesSearch,normalizeSearch } from './search'
describe('search',()=>{it('normalizes query',()=>expect(normalizeSearch('  Song   IDEA ')).toBe('song idea'));it('matches fields',()=>expect(matchesSearch('song','Project','Song idea')).toBe(true));it('blank query matches all',()=>expect(matchesSearch(' ','x')).toBe(true))})
