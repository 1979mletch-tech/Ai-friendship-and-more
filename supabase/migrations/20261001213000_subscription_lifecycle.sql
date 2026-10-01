alter table public.billing_subscriptions
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists current_period_end timestamptz;

comment on column public.billing_subscriptions.cancel_at_period_end is
  'Trusted Stripe webhook state: subscription remains entitled until period end when true.';

comment on column public.billing_subscriptions.current_period_end is
  'Trusted Stripe subscription period end, written only by the server webhook.';
