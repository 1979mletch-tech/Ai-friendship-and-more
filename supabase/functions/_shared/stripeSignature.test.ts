import { describe, expect, it } from 'vitest'
import { validStripeSignature } from './stripeSignature'
const hex=async(payload:string,secret:string,t:number)=>{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${t}.${payload}`)));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
describe('Stripe signature verification',()=>{
 it('accepts a current valid v1 signature',async()=>{const now=1_800_000_000_000,t=Math.floor(now/1000),payload='{"id":"evt_test"}',secret='whsec_test';const digest=await hex(payload,secret,t);await expect(validStripeSignature(payload,`t=${t},v1=${digest}`,secret,now)).resolves.toBe(true)})
 it('rejects stale and tampered signatures',async()=>{const now=1_800_000_000_000,t=Math.floor(now/1000)-301,payload='{}',secret='whsec_test';const digest=await hex(payload,secret,t);await expect(validStripeSignature(payload,`t=${t},v1=${digest}`,secret,now)).resolves.toBe(false);await expect(validStripeSignature('changed',`t=${Math.floor(now/1000)},v1=${digest}`,secret,now)).resolves.toBe(false)})
})
