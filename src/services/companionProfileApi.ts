import type { Session } from './apiClient'
import type { CompanionProfile } from '../utils/companionProfile'
import { sanitizeCompanionProfile } from '../utils/companionProfile'
const base=()=>{const v=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');if(!v)throw new Error('Server API is not configured.');return v}
const call=async<T>(s:Session,init:RequestInit={})=>{const r=await fetch(base()+'/companion-profile',{...init,headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.accessToken}`,...init.headers}});if(!r.ok)throw new Error(r.status===401?'Your session has expired. Please sign in again.':'Companion profile request failed.');return r.status===204?undefined as T:r.json() as Promise<T>}
export const companionProfileApi={
 get:(s:Session)=>call<CompanionProfile|null>(s),
 save:(s:Session,p:CompanionProfile)=>call<CompanionProfile>(s,{method:'PUT',body:JSON.stringify(sanitizeCompanionProfile(p))})
}
