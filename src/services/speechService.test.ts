import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateAuroraSpeech, speechAvailable } from './speechService'
import type { AuthSession } from './authService'
const session: AuthSession={accessToken:'token',refreshToken:'refresh',expiresAt:Date.now()+120000,user:{id:'u1',email:'u@example.test'}}
describe('speech service',()=>{
 afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs()})
 it('is fail-closed unless speech is explicitly enabled',()=>{vi.stubEnv('VITE_SUPABASE_URL','https://example.test');vi.stubEnv('VITE_SUPABASE_ANON_KEY','public');vi.stubEnv('VITE_AURORA_SPEECH_ENABLED','false');expect(speechAvailable()).toBe(false)})
 it('bounds text and requires an audio response',async()=>{vi.stubEnv('VITE_SUPABASE_URL','https://example.test');vi.stubEnv('VITE_SUPABASE_ANON_KEY','public');vi.stubEnv('VITE_AURORA_SPEECH_ENABLED','true');const f=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('not audio',{headers:{'Content-Type':'application/json'}}));await expect(generateAuroraSpeech(session,'x'.repeat(2000))).rejects.toThrow(/invalid voice response/i);const body=JSON.parse(String(f.mock.calls[0][1]?.body));expect(body.text).toHaveLength(1500)})
})
