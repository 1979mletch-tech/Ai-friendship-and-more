export const retryDelayMs=(attempt:number,base=500,max=8000)=>Math.min(max,base*2**Math.max(0,attempt))
export const canRetryStatus=(status:number)=>status===408||status===429||status>=500
