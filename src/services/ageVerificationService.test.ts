import { beforeEach, describe, expect, it, vi } from 'vitest'
import { finishAgeVerification, hasPendingAgeVerification, startAgeVerification } from './ageVerificationService'
import type { AuthSession } from './authService'

const session: AuthSession = { accessToken: 'token', refreshToken: 'refresh', expiresAt: Date.now()+120000, user:{id:'user-a',email:'a@example.test'} }
const storage=()=>{const s=new Map<string,string>();return {getItem:(k:string)=>s.get(k)??null,setItem:(k:string,v:string)=>s.set(k,v),removeItem:(k:string)=>s.delete(k)}}

describe('age verification service',()=>{
 beforeEach(()=>{Object.defineProperty(globalThis,'localStorage',{value:storage(),configurable:true});vi.restoreAllMocks();vi.unstubAllEnvs();vi.stubEnv('VITE_SUPABASE_URL','https://example.test');vi.stubEnv('VITE_SUPABASE_ANON_KEY','public-key')})
 it('requires a valid https verification URL and session id',async()=>{vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({sessionId:'bad',url:'http://unsafe.test'})));await expect(startAgeVerification(session)).rejects.toThrow(/invalid verification link/i);expect(hasPendingAgeVerification(session)).toBe(false)})
 it('stores only the provider session id while verification is pending',async()=>{vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({sessionId:'vs_abc123',url:'https://verify.test/session'})));await expect(startAgeVerification(session)).resolves.toBe('https://verify.test/session');expect(hasPendingAgeVerification(session)).toBe(true)})
 it('clears pending state after verified completion',async()=>{const f=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify({sessionId:'vs_abc123',url:'https://verify.test/session'}))).mockResolvedValueOnce(new Response(JSON.stringify({verified:true,status:'verified'})));await startAgeVerification(session);await expect(finishAgeVerification(session)).resolves.toMatchObject({verified:true});expect(f).toHaveBeenCalledTimes(2);expect(hasPendingAgeVerification(session)).toBe(false)})
})
