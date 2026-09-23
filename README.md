# Business by Becca

**Welcome to The Office.**

Marketing site + member portal — courses, calculators, toolkit, vault, community (The Office), Studio CMS, signup/login, and Stripe subscriptions.

## What’s included

- **Courses:** Startup Foundations, Money & Margins, Launch & Sales
- **Studio:** Admin (`r.lyons1@icloud.com`) edits programs/lessons and menu topics
- **Calculators:** Pricing, break-even, revenue goal, runway, profit, offer stack
- **Toolkit:** Offer builder, ideal client, launch planner, CEO scorecard
- **Vault:** Copyable scripts and templates
- **The Office:** Member community space
- **Access:** Free preview + membership (`$49/mo` or `$397/yr`)
- **Modes:** Demo (localStorage) works with zero keys; live uses Supabase + Stripe

## Stack

- Frontend: Vite + React + React Router
- Auth / DB: Supabase (optional)
- Payments: Stripe Checkout via Netlify Functions
- Host: Netlify (`netlify.toml` included)

## Subscriptions (yes)

Monthly **$49** and yearly **$397** via Stripe Checkout. Members cancel from Account → Manage subscription.

- Demo (no Stripe keys): subscribe unlocks instantly on-device
- Live: set keys per **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** and deploy from Git (not Drop) so Netlify Functions run

## Quick start

```bash
npm install
cp .env.example .env   # optional for live mode
npm run dev
```

1. Create an account (demo accepts any password)
2. Open `/portal` — free lessons + Pricing calculator + CEO scorecard
3. **Pricing** → pick a plan (demo unlocks instantly; live Checkout when Stripe is set)
4. Explore Courses, Calculators, Toolkit, Vault, and The Office
5. Admin email opens **Studio** to edit programs and nav topics

## Supabase migrations

Run in order in the SQL editor:

1. `supabase/migrations/001_profiles.sql`
2. `supabase/migrations/002_launch_ready.sql` — courses CMS, drafts, community feed, admin flag, plan protection

## Netlify env vars

From `.env.example` — see README section in prior commits for full list. Live membership unlocks only via Stripe webhook.

## Static zip

`business_by_becca_static.zip` is a built `dist/` for Netlify Drop previews.

## Brand

Signature pink `#FF2D8B`, soft pink, energy yellow, clarity blue, clean, ink — DM Sans / Playfair Display / Inter.
