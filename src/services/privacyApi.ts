import type { Session } from './apiClient'
const base=()=>{const v=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');if(!v)throw new Error('Server API is not configured.');return v}
const call=async<T>(path:string,s:Session,init:RequestInit={})=>{const r=await fetch(base()+path,{...init,headers:{Authorization:`Bearer ${s.accessToken}`,...init.headers}});if(!r.ok)throw new Error(r.status===401?'Your session has expired. Please sign in again.':'Privacy request failed.');return r.status===204?undefined as T:r.json() as Promise<T>}
export const privacyApi={exportData:(s:Session)=>call<Record<string,unknown>>('/account/export',s),clearConversations:(s:Session)=>call<void>('/conversations',s,{method:'DELETE'}),clearMemories:(s:Session)=>call<void>('/memories',s,{method:'DELETE'})}
