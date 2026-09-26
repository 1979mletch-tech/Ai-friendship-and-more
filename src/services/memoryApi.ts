import type { Session } from './apiClient'
import { isSafeMemoryId } from '../utils/objectIdPolicy'
export type RemoteMemory={id:string;label:string;value:string;createdAt:string}
const url=()=>{const v=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');if(!v)throw new Error('Server API is not configured.');return v}
const req=async<T>(path:string,s:Session,init:RequestInit={}):Promise<T>=>{const r=await fetch(url()+path,{...init,headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.accessToken}`,...init.headers}});if(!r.ok)throw new Error(r.status===401?'Your session has expired. Please sign in again.':'Memory request failed.');return r.status===204?undefined as T:r.json()}
export const memoryApi={
 list:(s:Session)=>req<RemoteMemory[]>('/memories',s),
 save:(s:Session,label:string,value:string)=>req<RemoteMemory>('/memories',s,{method:'POST',body:JSON.stringify({label,value})}),
 remove:(s:Session,id:string)=>{if(!isSafeMemoryId(id))throw new Error('Invalid memory identifier.');return req<void>(`/memories/${encodeURIComponent(id)}`,s,{method:'DELETE'})},
 clear:(s:Session)=>req<void>('/memories',s,{method:'DELETE'})
}
