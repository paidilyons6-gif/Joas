# Business by Becca

**Like the village, but for business.**

Marketing site + elite member portal — courses, financial calculators, startup toolkit, signup/login, and Stripe subscriptions.

## Portal product

- **Courses:** Startup Foundations, Money & Margins, Launch & Sales
- **Calculators:** Pricing, break-even, revenue goal, runway, profit, offer stack
- **Toolkit:** Offer builder, ideal client, 7-day launch planner, CEO scorecard
- **Vault:** Copyable scripts and templates
- **Access:** Free preview + membership unlock (`$49/mo` or `$397/yr`)

## Stack

- Frontend: Vite + React + React Router
- Auth / DB: Supabase (optional — demo mode works without it)
- Payments: Stripe Checkout via Netlify Functions
- Host: Netlify (`netlify.toml` included)

## Quick start (demo mode)

```bash
npm install
npm run dev
```

1. Create an account
2. Open `/portal` — free lessons + Pricing calculator + CEO scorecard
3. Go to **Pricing** → pick a plan (demo unlocks instantly)
4. Explore Courses, Calculators, Toolkit, Vault

## Go live on Netlify

1. Connect this GitHub repo
2. Add env vars from `.env.example`
3. Run `supabase/migrations/001_profiles.sql`
4. Create Stripe prices + webhook → `/.netlify/functions/stripe-webhook`

## Brand

Signature pink `#FF2D8B`, soft pink, energy yellow, clarity blue, clean, ink — DM Sans / Playfair Display / Inter.
