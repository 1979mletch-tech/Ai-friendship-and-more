import Stripe from 'npm:stripe@^22'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (request) => {
  const origin = Deno.env.get('APP_ORIGIN')
  const headers = { 'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin && request.headers.get('origin') === origin ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' }
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers })
  if (!origin || request.headers.get('origin') !== origin) return reply({ error: 'Origin not allowed' }, 403)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405)
  const token = request.headers.get('authorization')?.replace(/^Bearer /i, '')
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!token) return reply({ error: 'Sign in required' }, 401)
  if (!url || !anon || !service || !stripeKey) return reply({ error: 'Billing not configured' }, 503)
  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } })
  const { data: { user }, error } = await userClient.auth.getUser(token)
  if (error || !user?.email) return reply({ error: 'Sign in required' }, 401)
  let body: { action?: string; plan?: string }
  try { body = await request.json() } catch { return reply({ error: 'Invalid request' }, 400) }
  const admin = createClient(url, service, { auth: { persistSession: false } })
  const stripe = new Stripe(stripeKey)
  const { data: mapping } = await admin.from('billing_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
  try {
    if (body.action === 'portal') {
      if (!mapping) return reply({ error: 'No billing account found' }, 404)
      const session = await stripe.billingPortal.sessions.create({ customer: mapping.stripe_customer_id, return_url: `${origin}/#/cloud` })
      return reply({ url: session.url })
    }
    if (body.action !== 'checkout' || !['monthly', 'annual'].includes(body.plan ?? '')) return reply({ error: 'Invalid billing action' }, 400)
    const { data: existing } = await userClient.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle()
    if (existing && ['active', 'trialing', 'past_due'].includes(existing.status)) return reply({ error: 'Manage your existing subscription in the billing portal' }, 409)
    const price = body.plan === 'annual' ? Deno.env.get('STRIPE_PRICE_ANNUAL') : Deno.env.get('STRIPE_PRICE_MONTHLY')
    if (!price) return reply({ error: 'Plan not configured' }, 503)
    let customer = mapping?.stripe_customer_id
    if (!customer) {
      const created = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })
      customer = created.id
      const { error: saveError } = await admin.from('billing_customers').insert({ user_id: user.id, stripe_customer_id: customer })
      if (saveError) return reply({ error: 'Could not create billing account' }, 503)
    }
    const session = await stripe.checkout.sessions.create({ mode: 'subscription', customer,
      client_reference_id: user.id, line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${origin}/#/cloud`, cancel_url: `${origin}/#/cloud` })
    return reply({ url: session.url })
  } catch { return reply({ error: 'Billing service unavailable' }, 502) }
})
