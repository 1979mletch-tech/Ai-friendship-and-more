import{describe,expect,it}from'vitest';import{shouldCreateRemoteConversation}from'./conversationOrigin'
describe('conversation origin',()=>{it('never treats a local id as remotely persisted',()=>{expect(shouldCreateRemoteConversation('local',true)).toBe(true);expect(shouldCreateRemoteConversation('remote',true)).toBe(false);expect(shouldCreateRemoteConversation('remote',false)).toBe(true)})})
