export type HydrationOutcome<T>={value?:T;error?:unknown}
export const settledValue=<T>(result:PromiseSettledResult<T>):HydrationOutcome<T>=>result.status==='fulfilled'?{value:result.value}:{error:result.reason}
export const syncFromOutcomes=(outcomes:HydrationOutcome<unknown>[])=>outcomes.every(x=>x.value!==undefined)?'synced' as const:outcomes.some(x=>x.value!==undefined)?'partial' as const:'error' as const
