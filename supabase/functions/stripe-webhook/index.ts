import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { validStripeSignature } from '../_shared/stripeSignature.ts'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
  const key = Deno.env.get('STRIPE_SECRET_KEY') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!secret || !key || !serviceKey) return new Response('Billing not configured', { status: 503 })
  const raw = await req.text()
  if (!await validStripeSignature(raw, req.headers.get('stripe-signature') || '', secret)) {
    return new Response('Invalid signature', { status: 400 })
  }
  let event: { type?: string; data?: { object?: { id?: string } } }
  try { event = JSON.parse(raw) } catch { return new Response('Invalid event', { status: 400 }) }
  if (!event.type?.startsWith('customer.subscription.')) return new Response('ok')
  const id = event.data?.object?.id
  if (!id || !/^sub_[a-zA-Z0-9]+$/.test(id)) return new Response('Invalid subscription', { status: 400 })

  // Read current Stripe state to tolerate retried or out-of-order events.
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
  }).catch(() => null)
  if (!response?.ok) return new Response('Subscription lookup failed', { status: 503 })
  const subscription = await response.json()
  const userId = subscription.metadata?.user_id
  const priceId = subscription.items?.data?.[0]?.price?.id
  const monthly = Deno.env.get('STRIPE_PRICE_MONTHLY')
  const annual = Deno.env.get('STRIPE_PRICE_ANNUAL')
  const plan = priceId === monthly ? 'pro-monthly' : priceId === annual ? 'pro-annual' : null
  if (!plan || typeof userId !== 'string' || !/^[0-9a-f-]{36}$/.test(userId) ||
      typeof subscription.customer !== 'string' || !/^cus_[a-zA-Z0-9]+$/.test(subscription.customer)) {
    return new Response('Unrecognised subscription', { status: 400 })
  }
  if (Deno.env.get('BILLING_LIVE_ENABLED') === 'true' && subscription.livemode !== true) {
    return new Response('Test subscription rejected', { status: 400 })
  }
  const admin = createClient(Deno.env.get('SUPABASE_URL') || '', serviceKey)
  const { data: existing, error: readError } = await admin.from('billing_subscriptions')
    .select('stripe_subscription_id,status').eq('user_id', userId).maybeSingle()
  if (readError) return new Response('Could not check subscription', { status: 503 })
  if (existing && existing.stripe_subscription_id !== id &&
      ['active', 'trialing'].includes(existing.status) && !['active', 'trialing'].includes(subscription.status)) {
    return new Response('ok')
  }
  const { error } = await admin.from('billing_subscriptions').upsert({
    user_id: userId, stripe_customer_id: subscription.customer, stripe_subscription_id: id,
    plan, status: subscription.status, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) return new Response('Could not save subscription', { status: 503 })
  return new Response('ok')
})
