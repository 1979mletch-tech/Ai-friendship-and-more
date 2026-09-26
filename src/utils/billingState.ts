export type BillingLoadState='idle'|'loading'|'loaded'|'error'
export const billingStateLabel=(state:BillingLoadState)=>state==='loading'?'Checking subscription…':state==='error'?'Subscription status is temporarily unavailable.':state==='loaded'?'Subscription status verified.':''
