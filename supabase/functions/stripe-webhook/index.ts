import Stripe from 'npm:stripe@^22'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Public webhook endpoint: Stripe signature verification replaces Supabase JWT.
Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const key = Deno.env.get('STRIPE_SECRET_KEY')
  const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')
  const url = Deno.env.get('SUPABASE_URL')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const signature = request.headers.get('Stripe-Signature')
  if (!key || !signingSecret || !url || !service) return new Response('Unavailable', { status: 503 })
  if (!signature) return new Response('Missing signature', { status: 400 })
  const stripe = new Stripe(key)
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature,
      signingSecret, undefined, Stripe.createSubtleCryptoProvider())
  } catch { return new Response('Invalid signature', { status: 400 }) }

  let subscriptionId: string | null = null
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null
  } else if (event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    subscriptionId = (event.data.object as Stripe.Subscription).id
  } else return Response.json({ received: true })
  if (!subscriptionId) return Response.json({ received: true })

  try {
    // Retrieve current state so delayed/out-of-order webhooks do not restore old access.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
    const priceId = subscription.items.data[0]?.price.id
    const allowedPrices = [Deno.env.get('STRIPE_PRICE_MONTHLY'), Deno.env.get('STRIPE_PRICE_ANNUAL')]
    if (!priceId || !allowedPrices.includes(priceId)) return Response.json({ received: true })
    const admin = createClient(url, service, { auth: { persistSession: false } })
    const { data: mapping, error: mappingError } = await admin.from('billing_customers').select('user_id').eq('stripe_customer_id', customerId).maybeSingle()
    if (mappingError || !mapping) return new Response('Customer not found', { status: 503 })
    const periodEnd = subscription.items.data[0]?.current_period_end
    const { error } = await admin.from('subscriptions').upsert({ user_id: mapping.user_id,
      stripe_subscription_id: subscription.id, status: subscription.status, price_id: priceId,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString() })
    if (error) return new Response('Could not save subscription', { status: 503 })
    return Response.json({ received: true })
  } catch { return new Response('Could not verify subscription', { status: 503 }) }
})
