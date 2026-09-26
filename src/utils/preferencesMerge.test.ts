import { describe,expect,it } from 'vitest'
import { mergePreferences } from './preferencesMerge'
describe('preference merge',()=>{const local={companionName:'Friend',tone:'warm' as const,interests:'music',memoryEnabled:true};it('keeps local without cloud',()=>expect(mergePreferences(local,null)).toEqual(local));it('uses cloud override',()=>expect(mergePreferences(local,{companionName:'Nova'}).companionName).toBe('Nova'));it('rejects blank cloud name',()=>expect(mergePreferences(local,{companionName:' '} as never).companionName).toBe('Friend'))})
