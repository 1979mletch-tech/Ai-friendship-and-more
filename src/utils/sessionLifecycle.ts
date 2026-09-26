export type SessionLifecycle='anonymous'|'active'|'expired'
export const sessionLifecycle=(token:string|undefined,expiresAt?:string):SessionLifecycle=>{if(!token)return'anonymous';if(expiresAt&&Date.parse(expiresAt)<=Date.now())return'expired';return'active'}
