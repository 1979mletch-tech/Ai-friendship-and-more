import { afterEach, describe, expect, it, vi } from 'vitest'
import { getBillingPlan, openBilling } from './billingService'
import type { AuthSession } from './authService'
const session: AuthSession={accessToken:'token',refreshToken:'refresh',expiresAt:Date.now()+120000,user:{id:'u1',email:'u@example.test'}}
describe('billing service',()=>{
 afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs()})
 it('defaults untrusted plan values to free',async()=>{vi.stubEnv('VITE_SUPABASE_URL','https://example.test');vi.stubEnv('VITE_SUPABASE_ANON_KEY','public');vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({plan:'admin-unlimited'})));await expect(getBillingPlan(session)).resolves.toBe('free')})
 it('sends bearer authentication to the trusted billing boundary',async()=>{vi.stubEnv('VITE_SUPABASE_URL','https://example.test');vi.stubEnv('VITE_SUPABASE_ANON_KEY','public');const f=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({plan:'pro-monthly'})));await expect(getBillingPlan(session)).resolves.toBe('pro-monthly');expect((f.mock.calls[0][1]?.headers as Record<string,string>).Authorization).toBe('Bearer token')})
 it('rejects non-https redirect URLs',async()=>{vi.stubEnv('VITE_SUPABASE_URL','https://example.test');vi.stubEnv('VITE_SUPABASE_ANON_KEY','public');vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({url:'javascript:alert(1)'})));await expect(openBilling(session,'checkout','pro-monthly')).rejects.toThrow(/invalid billing link/i)})
})
