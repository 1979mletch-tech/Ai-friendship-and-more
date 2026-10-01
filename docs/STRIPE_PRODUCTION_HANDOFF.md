# AI Friendship — Stripe production handoff

The application payment path is code-complete but remains fail-closed until production credentials are installed in the deployment provider.

## Browser/public configuration

Set these on the exact frontend deployment:

```text
VITE_BILLING_PROVIDER=stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_...
VITE_STRIPE_PRICE_PRO_ANNUAL=price_...
```

These values are public identifiers. Never put `sk_live_...` or a webhook signing secret in a `VITE_*` variable.

## Server-only configuration

Configure these only in the backend/Edge Function secret store:

```text
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
APP_RETURN_URL=https://<production-origin>/<billing-return-path>
ALLOWED_ORIGIN=https://<production-origin>
BILLING_LIVE_ENABLED=true
```

Keep `BILLING_LIVE_ENABLED=false` until the live-mode checks below pass.

## Stripe dashboard configuration

1. Reuse the owner's existing verified Stripe account.
2. Create or select one recurring monthly Price and one recurring annual Price for AI Friendship.
3. Confirm currency and amounts in Stripe; the browser must not determine price.
4. Enable/configure the Stripe customer portal.
5. Register the deployed `stripe-webhook` endpoint and copy its signing secret to the backend secret store.
6. Subscribe the endpoint to `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
7. Keep Stripe Identity/adult eligibility configuration separate from subscription entitlement; an unverified account cannot open billing.

## Required live-mode verification

Use disposable/synthetic accounts and verify, in order:

- unverified adult cannot create Checkout;
- invalid/unsigned webhook is rejected;
- monthly Checkout redirects to Stripe and returns safely;
- annual Checkout redirects to Stripe and returns safely;
- successful subscription webhook creates the user's trusted subscription state;
- browser/localStorage cannot grant Pro;
- active/trialing subscription receives paid server quota;
- duplicate active subscription attempt is rejected and portal is offered;
- customer portal opens only for the authenticated subscription owner;
- cancellation/update webhook changes trusted entitlement;
- test-mode subscriptions are rejected when `BILLING_LIVE_ENABLED=true`;
- two accounts cannot read each other's subscription rows;
- Stripe/API errors expose no secret values.

## Release switch

Only after every check above passes:

1. freeze the tested backend/function versions;
2. set `BILLING_LIVE_ENABLED=true`;
3. deploy the exact GREEN frontend commit with `VITE_BILLING_PROVIDER=stripe`;
4. run one final low-value live purchase/cancellation check if appropriate for the account;
5. retain webhook evidence and the exact deployed commit SHA.

A green source build alone is not evidence that Stripe production configuration is live.
