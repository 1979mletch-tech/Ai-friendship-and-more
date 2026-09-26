import { describe,expect,it } from 'vitest'
import { boundedCloudTitle,ownerMatches,safeRowId } from './cloudRows'
describe('cloud row guards',()=>{it('accepts uuid-shaped ids',()=>expect(safeRowId('12345678-1234-1234-1234-123456789abc')).not.toBe(''));it('rejects arbitrary ids',()=>expect(safeRowId('../x')).toBe(''));it('compares exact owner ids',()=>expect(ownerMatches('a','b')).toBe(false));it('bounds titles',()=>expect(boundedCloudTitle('<Hello>')).toBe('Hello'))})
