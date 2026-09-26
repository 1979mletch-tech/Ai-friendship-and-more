import type { LocalConversation, ChatMessage } from './chatPersistence'
type LegacyConversation={id:string;title?:string;createdAt?:string}
export const migrateConversations=(raw:unknown,legacyMessages:ChatMessage[]=[]):LocalConversation[]=>{
 if(!Array.isArray(raw))return[]
 return raw.flatMap((v,index)=>{if(!v||typeof v!=='object')return[];const x=v as Partial<LocalConversation>&LegacyConversation;if(typeof x.id!=='string')return[];const createdAt=typeof x.createdAt==='string'?x.createdAt:new Date(0).toISOString();const messages=Array.isArray(x.messages)?x.messages:(index===0?legacyMessages:[]);return[{id:x.id,title:typeof x.title==='string'?x.title:'Conversation',createdAt,updatedAt:typeof x.updatedAt==='string'?x.updatedAt:createdAt,messages}]})
}
