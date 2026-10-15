import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { validStripeSignature } from '../_shared/stripeSignature.ts'

const planByPrice: Record<string, string> = {
  'price_1ULbdmCnBoiV72UUnsHlPKah': 'pro-daily',
  'price_1ULbdrCnBoiV72UUHpsvDIc9': 'pro-weekly',
  'price_1ULbdyCnBoiV72UU8G420ftw': 'pro-monthly',
  'price_1ULbe3CnBoiV72UUBT3sGUEc': 'pro-annual',
}

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

  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
  }).catch(() => null)
  if (!response?.ok) return new Response('Subscription lookup failed', { status: 503 })
  const subscription = await response.json()
  const userId = subscription.metadata?.user_id
  const priceId = subscription.items?.data?.[0]?.price?.id
  const plan = typeof priceId === 'string' ? planByPrice[priceId] || null : null
  if (!plan || typeof userId !== 'string' || !/^[0-9a-f-]{36}$/.test(userId) ||
      typeof subscription.customer !== 'string' || !/^cus_[a-zA-Z0-9]+$/.test(subscription.customer)) {
    return new Response('Unrecognised subscription', { status: 400 })
  }
  if (Deno.env.get('BILLING_LIVE_ENABLED') === 'true' && subscription.livemode !== true) {
    return new Response('Test subscription rejected', { status: 400 })
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL') || '', serviceKey)
  const { data: existing, error: readError } = await admin.from('billing_subscriptions')
    .select('stripe_subscription_id,status,livemode').eq('user_id', userId).maybeSingle()
  if (readError) return new Response('Could not check subscription', { status: 503 })
  if (existing?.livemode === true && subscription.livemode !== true) return new Response('ok')
  if (existing && existing.livemode === subscription.livemode && existing.stripe_subscription_id !== id &&
      ['active', 'trialing'].includes(existing.status) && !['active', 'trialing'].includes(subscription.status)) {
    return new Response('ok')
  }

  const periodEnd = typeof subscription.current_period_end === 'number'
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null
  const { error } = await admin.from('billing_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: id,
    plan,
    status: subscription.status,
    livemode: subscription.livemode === true,
    cancel_at_period_end: subscription.cancel_at_period_end === true,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) return new Response('Could not save subscription', { status: 503 })
  return new Response('ok')
})
