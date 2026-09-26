export const sessionExpired=(status:number)=>status===401
export const forbiddenOwnership=(status:number)=>status===403
export const safeStatusMessage=(status:number,fallback:string)=>status===401?'Your session has expired. Please sign in again.':status===403?'You do not have access to that item.':status===429?'Too many requests. Please wait and try again.':status>=500?'The service is temporarily unavailable. Please try again.':fallback
