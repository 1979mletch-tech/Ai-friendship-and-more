import { describe, expect, it } from 'vitest'
import { safeTimestamp, sortNewestFirst } from './timestamps'
describe('timestamps',()=>{it('falls back for invalid values',()=>expect(safeTimestamp('bad')).toBe('Saved locally'));it('sorts newest first',()=>expect(sortNewestFirst([{updatedAt:'2026-01-01'},{updatedAt:'2026-02-01'}])[0]?.updatedAt).toBe('2026-02-01'))})
