import type { Session } from './apiClient'
import { conversationApi } from './conversationApi'
import type { LocalConversation } from '../utils/chatPersistence'
export const loadRemoteConversations=async(s:Session):Promise<LocalConversation[]>=>{
 const rows=await conversationApi.list(s)
 const full=await Promise.all(rows.map(async row=>({id:row.id,origin:'remote' as const,title:row.title,createdAt:row.updatedAt,updatedAt:row.updatedAt,messages:(await conversationApi.messages(s,row.id)).map(m=>({id:m.id,role:m.role,text:m.text,createdAt:m.createdAt,dayKey:m.createdAt.slice(0,10)}))})))
 return full.sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))
}
