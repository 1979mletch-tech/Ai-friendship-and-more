import { serviceFetch } from './serviceFetch'
import type { Session } from './apiClient'
import type { PlanId } from '../types/subscription'
import { readAppEnv } from '../config/env'
const base=()=>{const v=readAppEnv().apiBaseUrl;if(!v)throw new Error('Server API is not configured.');return v}
const req=async<T>(path:string,s:Session,init:RequestInit={}):Promise<T>=>{const r=await serviceFetch(base()+path,{...init,headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.accessToken}`,...init.headers}});if(!r.ok)throw new Error(r.status===401?'Your session has expired. Please sign in again.':'Billing request failed.');return r.status===204?undefined as T:r.json()}
export type BillingStatus={planId:PlanId;status:'free'|'active'|'past_due'|'canceled';renewsAt?:string}
export const billingApi={
 status:(s:Session)=>req<BillingStatus>('/billing/subscription',s),
 checkout:(s:Session,planId:Extract<PlanId,'pro-monthly'|'pro-annual'>)=>req<{url:string}>('/billing/checkout',s,{method:'POST',body:JSON.stringify({planId})}),
 portal:(s:Session)=>req<{url:string}>('/billing/portal',s,{method:'POST',body:'{}'})
}
