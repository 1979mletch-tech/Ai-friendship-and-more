import { safeStatusMessage } from '../utils/httpStatusPolicy'
import { serviceFetch } from './serviceFetch'
import type { Session } from './apiClient'
import { isSafeConversationId } from '../utils/objectIdPolicy'
export type RemoteConversation={id:string;title:string;updatedAt:string}
export type RemoteMessage={id:string;conversationId:string;role:'user'|'assistant';text:string;createdAt:string}
const headers=(s:Session)=>({'Content-Type':'application/json',Authorization:`Bearer ${s.accessToken}`})
const base=()=>{const v=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');if(!v)throw new Error('Server API is not configured.');return v}
const call=async<T>(path:string,s:Session,init:RequestInit={}):Promise<T>=>{const r=await serviceFetch(base()+path,{...init,headers:{...headers(s),...init.headers}});if(!r.ok)throw new Error(safeStatusMessage(r.status,'Conversation request failed.'));return r.status===204?undefined as T:r.json()}
export const conversationApi={
 list:(s:Session)=>call<RemoteConversation[]>('/conversations',s),
 create:(s:Session)=>call<RemoteConversation>('/conversations',s,{method:'POST',body:'{}'}),
 append:(s:Session,id:string,text:string,mode:'general'|'creative')=>{if(!isSafeConversationId(id))throw new Error('Invalid conversation identifier.');return call<{reply:string}>(`/conversations/${encodeURIComponent(id)}/messages`,s,{method:'POST',body:JSON.stringify({text,mode})})},
 messages:(s:Session,id:string)=>{if(!isSafeConversationId(id))throw new Error('Invalid conversation identifier.');return call<RemoteMessage[]>(`/conversations/${encodeURIComponent(id)}/messages`,s)},
 remove:(s:Session,id:string)=>{if(!isSafeConversationId(id))throw new Error('Invalid conversation identifier.');return call<void>(`/conversations/${encodeURIComponent(id)}`,s,{method:'DELETE'})}
}
