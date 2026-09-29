// Stripe Identity redirect flow. No ID images or date of birth are stored here.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isAdultDob } from '../_shared/adultDob.ts'

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || ''
const headers = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Content-Type': 'application/json',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

Deno.serve(async (req) => {
  if (!allowedOrigin || req.headers.get('Origin') !== allowedOrigin) return json({ error: 'Origin not allowed' }, 403)
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '') || ''
  if (!token) return json({ error: 'Sign in first' }, 401)
  const url = Deno.env.get('SUPABASE_URL') || ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  const client = createClient(url, anonKey)
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return json({ error: 'Invalid session' }, 401)
  if (user.app_metadata?.adult_verified === true) return json({ verified: true })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
  const dobKey = Deno.env.get('STRIPE_IDENTITY_DOB_KEY') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const returnUrl = Deno.env.get('APP_RETURN_URL') || ''
  if (!stripeKey || !dobKey || !serviceKey || !returnUrl.startsWith(allowedOrigin + '/')) {
    return json({ error: 'Age verification is not configured' }, 503)
  }
  let body: { action?: string; sessionId?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid request' }, 400) }

  if (body.action === 'start') {
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: reserved, error: limitError } = await caller.rpc('reserve_age_verification_start')
    if (limitError) return json({ error: 'Age verification is temporarily unavailable' }, 503)
    if (!reserved) return json({ error: 'Please wait before starting another age check' }, 429)
    const form = new URLSearchParams({
      type: 'document',
      client_reference_id: user.id,
      return_url: returnUrl,
      'options[document][require_live_capture]': 'true',
    })
    const response = await fetch('https://api.stripe.com/v1/identity/verification_sessions', {
      method: 'POST', headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
    }).catch(() => null)
    if (!response?.ok) return json({ error: 'Could not start age verification' }, 502)
    const result = await response.json()
    if (typeof result.id !== 'string' || typeof result.url !== 'string' || !result.url.startsWith('https://')) {
      return json({ error: 'Invalid verification response' }, 502)
    }
    return json({ sessionId: result.id, url: result.url })
  }

  if (body.action === 'complete') {
    if (!/^vs_[a-zA-Z0-9]+$/.test(body.sessionId || '')) return json({ error: 'Invalid verification reference' }, 400)
    const response = await fetch(`https://api.stripe.com/v1/identity/verification_sessions/${body.sessionId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    }).catch(() => null)
    if (!response?.ok) return json({ error: 'Could not check verification' }, 502)
    const result = await response.json()
    if (result.client_reference_id !== user.id) return json({ error: 'Verification does not belong to this account' }, 403)
    if (result.status !== 'verified') return json({ verified: false, status: result.status })
    // A Stripe test session is useful for QA but must never unlock live AI.
    if (result.livemode !== true || !stripeKey.startsWith('sk_live_')) {
      return json({ verified: false, status: 'test-mode' })
    }
    // The ordinary secret key cannot read DOB. A separately scoped restricted
    // key must retrieve it for the 18+ decision. Never store or return DOB.
    const details = await fetch(`https://api.stripe.com/v1/identity/verification_sessions/${body.sessionId}?expand%5B%5D=verified_outputs.dob`, {
      headers: { Authorization: `Bearer ${dobKey}` },
    }).catch(() => null)
    if (!details?.ok) return json({ error: 'Could not confirm age' }, 503)
    const verifiedSession = await details.json()
    if (verifiedSession.id !== result.id || verifiedSession.status !== 'verified' ||
        verifiedSession.client_reference_id !== user.id || verifiedSession.livemode !== true) {
      return json({ error: 'Verification changed' }, 409)
    }
    if (!isAdultDob(verifiedSession.verified_outputs?.dob)) return json({ verified: false, status: 'not-eligible' })
    const admin = createClient(url, serviceKey)
    const updated = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, adult_verified: true },
    })
    if (updated.error) return json({ error: 'Could not save verification' }, 503)
    return json({ verified: true })
  }
  return json({ error: 'Unknown action' }, 400)
})
