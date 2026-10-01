import { describe,expect,it } from 'vitest'
import { filterHistoryByPlan,withinHistoryPlan } from './historyPolicy'
describe('history policy',()=>{const now=Date.parse('2026-09-26T00:00:00Z');it('keeps recent',()=>expect(withinHistoryPlan('2026-09-25T00:00:00Z',7,now)).toBe(true));it('drops old',()=>expect(filterHistoryByPlan([{createdAt:'2026-01-01'},{createdAt:'2026-09-25'}],7,now)).toHaveLength(1));it('keeps undated legacy records',()=>expect(withinHistoryPlan(undefined,7,now)).toBe(true))})
