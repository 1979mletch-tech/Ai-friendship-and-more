import{describe,expect,it}from'vitest';import{conversationDeleteLabel,memoryDeleteLabel}from'./accessibleLabels'
describe('accessible action labels',()=>{it('names destructive action targets',()=>{expect(conversationDeleteLabel('Ideas')).toBe('Delete conversation: Ideas');expect(memoryDeleteLabel('Music')).toBe('Forget memory: Music')})})
