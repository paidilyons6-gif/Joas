# Payments setup

## BodiesByBecca membership (App Store / Play Store)

Ongoing membership is **BodiesByBecca membership**, billed through Apple or Google after challenges end (October).

1. Publish / update the Bodies by Becca app subscription products
2. Set on Netlify:
   - `VITE_APP_STORE_URL` — direct App Store listing
   - `VITE_PLAY_STORE_URL` — direct Play Store listing
3. Members create a free account on this site with the **same email**, then unlock The Office (wire app receipt → Supabase `profiles.plan` when ready)

Demo: Pricing → “Preview unlock” simulates membership on this device.

## Website programs (HOTMESS etc.)

Programs keep selling **on the website** (separate from app membership).

1. Stripe → Product → one-time price for HOTMESS
2. Netlify env: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_HOTMESS`
3. `/programs` → Get HOTMESS → Stripe Checkout (`mode: payment`)

Membership checkout is **not** on Stripe anymore — only programs.
