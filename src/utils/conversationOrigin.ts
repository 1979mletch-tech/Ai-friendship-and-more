export type ConversationOrigin='local'|'remote'
export const shouldCreateRemoteConversation=(origin:ConversationOrigin,synced:boolean)=>origin==='local'||!synced
