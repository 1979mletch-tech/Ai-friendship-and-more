import{describe,expect,it}from'vitest';import{retentionSummary}from'./retentionSummary';import{newLocalConversation}from'./chatPersistence'
describe('retention summary',()=>{it('reports expired records without silently deleting them',()=>{const x={...newLocalConversation('x'),updatedAt:'2020-01-01T00:00:00.000Z'};expect(retentionSummary([x],365,new Date('2026-01-01')).expired).toBe(1)})})
