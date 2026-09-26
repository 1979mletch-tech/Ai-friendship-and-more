import{describe,expect,it}from'vitest';import{isSafeConversationId,isSafeMemoryId}from'./objectIdPolicy'
describe('object id policy',()=>{it('rejects path-like and oversized identifiers',()=>{expect(isSafeConversationId('../other')).toBe(false);expect(isSafeMemoryId('x'.repeat(129))).toBe(false);expect(isSafeConversationId('opaque-123')).toBe(true)})})
