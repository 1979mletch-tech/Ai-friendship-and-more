import { describe, expect, it } from 'vitest'
import { remainingCopy } from './limitsCopy'
describe('usage copy',()=>{it('never shows negative remaining',()=>expect(remainingCopy(30,25)).toBe('Daily message limit reached.'));it('shows remaining',()=>expect(remainingCopy(3,25)).toContain('22'))})
