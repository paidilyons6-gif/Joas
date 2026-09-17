# Business by Becca

Marketing site + member portal for **Business by Becca** — training, resources, signup/login, and Stripe subscriptions.

## Stack

- **Frontend:** Vite + React + React Router
- **Auth / DB:** Supabase (optional — demo mode works without it)
- **Payments:** Stripe Checkout subscriptions via Netlify Functions
- **Host:** Netlify (`netlify.toml` included)

## Product model

- Free account → portal home + Phase 1 training
- **Membership** — $49/mo
- **Founders Year** — $397/yr (best value)
- Members unlock full curriculum, resources, and billing portal

## Quick start (demo mode)

No keys needed. Accounts and “payments” run on this device via localStorage.

```bash
npm install
npm run dev
```

1. Open the site → **Let’s do this**
2. Create an account
3. Go to **Pricing** → pick a plan (demo unlocks instantly)
4. Train inside **/portal**

## Go live on Netlify

1. Connect this GitHub repo in Netlify
2. Build command `npm run build`, publish `dist` (already in `netlify.toml`)
3. Add environment variables from `.env.example`
4. Create two Stripe Prices (monthly + annual) and paste IDs into `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL`
5. Run the SQL in `supabase/migrations/001_profiles.sql` in your Supabase project
6. Point a Stripe webhook to `https://YOUR_SITE/.netlify/functions/stripe-webhook` for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Local Netlify functions

```bash
npx netlify dev
```

## Brand

Follows the Business by Becca board: signature pink `#FF2D8B`, soft pink, energy yellow, clarity blue, clean, ink — DM Sans / Playfair Display / Inter.
