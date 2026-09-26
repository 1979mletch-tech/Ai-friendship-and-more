export type HydrationPart<T>={ok:true;value:T}|{ok:false;error:unknown}
export const hydrationPart=<T>(r:PromiseSettledResult<T>):HydrationPart<T>=>r.status==='fulfilled'?{ok:true,value:r.value}:{ok:false,error:r.reason}
export const hydrationStatus=(parts:HydrationPart<unknown>[])=>parts.every(p=>p.ok)?'synced' as const:parts.some(p=>p.ok)?'partial' as const:'error' as const
