/** Public-safe BuildRush job listing shape. Not wired to production yet. */
export type PublicJob = Readonly<{
 id: string; title: string; category: string; fixed_price: number;
 location_city: string; status: string; timeframe: string;
}>;
const fields = ['id','title','category','fixed_price','location_city','status','timeframe'] as const;
/** Deny-by-default projection. Always enforce row visibility in the backend as well. */
export function toPublicJob(input: Record<string, unknown>): PublicJob {
 const out: Record<string, unknown> = {};
 for (const key of fields) {
   if (key === 'fixed_price') {
     const amount = input[key];
     out[key] = typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 ? amount : 0;
   } else {
     const value = input[key];
     out[key] = typeof value === 'string' ? value : '';
   }
 }
 return out as PublicJob;
}
