export const isSafeConversationId=(id:string)=>id.length>=1&&id.length<=128&&!/[/?#\\]/.test(id)
export const isSafeMemoryId=(id:string)=>id.length>=1&&id.length<=128&&!/[/?#\\]/.test(id)
