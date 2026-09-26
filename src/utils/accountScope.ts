export const accountScopeKey=(userId:string,key:string)=>`ai_friendship_user_${encodeURIComponent(userId)}_${key}`
export const accountScopedKeys=(userId:string)=>['conversations','active_conversation','memories','companion_profile'].map(k=>accountScopeKey(userId,k))
