export type SessionMeta={expiresAt?:string}
export const isSessionExpired=(meta:SessionMeta,now=new Date())=>Boolean(meta.expiresAt&&new Date(meta.expiresAt).getTime()<=now.getTime())
export const sessionMessage=(status:number)=>status===401?'Your session has expired. Please sign in again.':status===429?'Too many requests. Please wait and try again.':'Something went wrong. Please try again.'
