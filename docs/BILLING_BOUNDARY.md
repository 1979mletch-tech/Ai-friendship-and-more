# Billing Boundary

Pricing UI is a preview until trusted billing is implemented.

Production paid access requires:
- Stripe Checkout or equivalent through a trusted server path;
- webhook signature verification;
- server-owned subscription/customer mapping;
- server-verified entitlement checks;
- cancellation/renewal/failure handling;
- idempotent webhook processing;
- customer portal/support path;
- tax/price/legal review.

A browser-selected plan must never grant trusted paid entitlement by itself.
