import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { liveCustomerSubscription, livePaidSubscription } from '../_shared/liveSubscription.ts'

const origin = Deno.env.get('ALLOWED_ORIGIN') || ''
const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (!origin || req.headers.get('Origin') !== origin) return json({ error: 'Origin not allowed' }, 403)
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '') || ''
  if (!token) return json({ error: 'Sign in first' }, 401)
  const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_ANON_KEY') || '', {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return json({ error: 'Invalid session' }, 401)
  if (user.app_metadata?.adult_verified !== true) return json({ error: 'Adult verification required' }, 403)
  if (Deno.env.get('BILLING_LIVE_ENABLED') !== 'true') return json({ error: 'Payments are not open yet' }, 503)
  const secret = Deno.env.get('STRIPE_SECRET_KEY') || ''
  const webhook = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
  const monthly = Deno.env.get('STRIPE_PRICE_MONTHLY') || ''
  const annual = Deno.env.get('STRIPE_PRICE_ANNUAL') || ''
  const returnUrl = Deno.env.get('APP_RETURN_URL') || ''
  if (!secret.startsWith('sk_live_') || !webhook || !monthly.startsWith('price_') ||
      !annual.startsWith('price_') || !returnUrl.startsWith(origin + '/')) {
    return json({ error: 'Payments are not configured' }, 503)
  }
  let body: { action?: string; plan?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid request' }, 400) }
  const { data: current, error: dbError } = await supabase.from('billing_subscriptions')
    .select('stripe_customer_id,plan,status,livemode').eq('user_id', user.id).maybeSingle()
  if (dbError) return json({ error: 'Could not check subscription' }, 503)
  // Test-mode rows may exist from sandbox QA. They cannot grant paid access or
  // supply a customer ID for live Checkout/Portal after billing is enabled.
  const liveCurrent = liveCustomerSubscription(current)

  if (body.action === 'status') return json({ plan: livePaidSubscription(liveCurrent) ? liveCurrent.plan : 'free', status: liveCurrent?.status || 'none' })
  if (body.action !== 'checkout' && body.action !== 'portal') return json({ error: 'Unknown action' }, 400)
  if (body.action === 'checkout' && livePaidSubscription(liveCurrent)) {
    return json({ error: 'You already have a subscription. Open billing management instead.' }, 409)
  }
  if (body.action === 'portal' && !liveCurrent?.stripe_customer_id) return json({ error: 'No subscription to manage' }, 404)
  const form = new URLSearchParams()
  let path: string
  if (body.action === 'portal') {
    path = 'billing_portal/sessions'
    form.set('customer', liveCurrent!.stripe_customer_id)
    form.set('return_url', returnUrl)
  } else {
    const price = body.plan === 'pro-monthly' ? monthly : body.plan === 'pro-annual' ? annual : ''
    if (!price) return json({ error: 'Choose a valid plan' }, 400)
    path = 'checkout/sessions'
    form.set('mode', 'subscription')
    form.set('line_items[0][price]', price)
    form.set('line_items[0][quantity]', '1')
    form.set('client_reference_id', user.id)
    form.set('subscription_data[metadata][user_id]', user.id)
    if (liveCurrent?.stripe_customer_id) form.set('customer', liveCurrent.stripe_customer_id)
    else if (user.email) form.set('customer_email', user.email)
    form.set('success_url', returnUrl)
    form.set('cancel_url', returnUrl)
  }
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
  }).catch(() => null)
  if (!response?.ok) return json({ error: 'Stripe could not open billing' }, 502)
  const result = await response.json()
  if (typeof result.url !== 'string' || !result.url.startsWith('https://')) return json({ error: 'Invalid billing link' }, 502)
  return json({ url: result.url })
})
