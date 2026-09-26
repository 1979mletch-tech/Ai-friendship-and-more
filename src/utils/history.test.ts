import { describe, expect, it } from 'vitest'
import { filterHistory, historySummary } from './history'

const messages = [
  { id:'1', role:'user' as const, text:'Blue painting', createdAt:'x', dayKey:'x' },
  { id:'2', role:'assistant' as const, text:'Try a softer shape', createdAt:'x', dayKey:'x' },
]
describe('history helpers', () => {
  it('filters text', () => expect(filterHistory(messages, 'blue')).toHaveLength(1))
  it('summarizes roles', () => expect(historySummary(messages)).toEqual({ total:2,user:1,assistant:1 }))
})
