export const deleteResultOk=(status:number,body:unknown)=>status>=200&&status<300&&Boolean(body&&typeof body==='object')
export const deletionFailureCopy=(cloud:boolean)=>cloud?'Cloud account deletion did not complete. Local data has been kept so you can retry.':'Cloud account deletion is not configured on this deployment.'
