import type{LocalConversation}from'./chatPersistence';import type{MemoryItem}from'./memoryStore';import type{CompanionProfile}from'./companionProfile'
export type AccountUiData={conversations:LocalConversation[];memories:MemoryItem[];companion:CompanionProfile;activeConversationId:string}
export const emptyAccountUiData=():AccountUiData=>({conversations:[],memories:[],companion:{name:'Friend',tone:'warm',interests:''},activeConversationId:'default'})
export const shouldResetForAccountChange=(previousUserId:string|undefined,nextUserId:string|undefined)=>Boolean(previousUserId&&previousUserId!==nextUserId)
