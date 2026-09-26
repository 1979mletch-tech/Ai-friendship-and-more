export type RedirectKind='checkout'|'portal'
export const trustedRedirect=(raw:string,kind:RedirectKind):string=>{const u=new URL(raw);if(u.protocol!=='https:')throw new Error('Unsafe billing redirect.');const allowed=kind==='checkout'?['checkout.stripe.com']:['billing.stripe.com'];if(!allowed.includes(u.hostname))throw new Error('Unsafe billing redirect.');return u.toString()}
