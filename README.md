# Business by Becca

**Like the office, but for business.**

Marketing site + member portal — courses, calculators, toolkit, vault, office feed, Studio CMS, signup/login, and Stripe subscriptions.

## What’s included

- **Courses:** Startup Foundations, Money & Margins, Launch & Sales (full lesson curriculum)
- **Studio:** Admin (`r.lyons1@icloud.com`) edits programs/lessons and menu topics
- **Calculators:** Pricing, break-even, revenue goal, runway, profit, offer stack
- **Toolkit:** Offer builder, ideal client, launch planner, CEO scorecard
- **Vault:** Copyable scripts and templates
- **The Office:** Member community feed
- **Access:** Free preview + membership (`$49/mo` or `$397/yr`)
- **Modes:** Demo (localStorage) works with zero keys; live uses Supabase + Stripe

## Stack

- Frontend: Vite + React + React Router
- Auth / DB: Supabase (optional)
- Payments: Stripe Checkout via Netlify Functions
- Host: Netlify (`netlify.toml` included)

## Quick start

```bash
npm install
cp .env.example .env   # optional for live mode
npm run dev
```

1. Create an account (demo accepts any password)
2. Open `/portal` — free lessons + Pricing calculator + CEO scorecard
3. **Pricing** → pick a plan (demo unlocks instantly; live Checkout when Stripe is set)
4. Explore Courses, Calculators, Toolkit, Vault, Office
5. Admin email opens **Studio** to edit programs and nav topics

## Supabase migrations

Run in order in the SQL editor:

1. `supabase/migrations/001_profiles.sql`
2. `supabase/migrations/002_launch_ready.sql` — courses CMS, drafts, office feed, admin flag, plan protection

Project: **Businessbybecca** (`utnsdavbxbnacseqerjr`)

## Netlify env vars

From `.env.example`:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (webhook plan updates)
- `VITE_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL`
- `STRIPE_WEBHOOK_SECRET` → endpoint `/.netlify/functions/stripe-webhook`
- `VITE_ADMIN_EMAILS` (optional override; default includes `r.lyons1@icloud.com`)

Live membership unlocks **only** via Stripe webhook (client cannot set `plan`).

## Static zip

`business_by_becca_static.zip` is a built `dist/` you can drag onto Netlify Drop for a quick preview (API routes need a full Netlify deploy).

## Brand

Signature pink `#FF2D8B`, soft pink, energy yellow, clarity blue, clean, ink — DM Sans / Playfair Display / Inter.
