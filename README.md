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

## Studio (create courses)

Becca can create Village-style courses at `/portal/studio` when signed in with an admin email.

Set admin emails in `.env`:

```bash
VITE_ADMIN_EMAILS=your@email.com,another@email.com
```

Defaults include common Becca emails for local testing. Published studio courses appear in **Courses** for members.


Project: **Businessbybecca** (`utnsdavbxbnacseqerjr`, eu-west-1)

Already applied:
- `profiles` table + RLS
- signup trigger to create profiles
- email auth with autoconfirm (instant portal access)

Local: copy `.env.example` → `.env` and fill anon + service role keys from the Supabase dashboard (API settings). A working `.env` is gitignored.

Netlify env vars to set:
- `VITE_SUPABASE_URL=https://utnsdavbxbnacseqerjr.supabase.co`
- `VITE_SUPABASE_ANON_KEY=...` (anon/public)
- `SUPABASE_URL=https://utnsdavbxbnacseqerjr.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=...` (secret — for Stripe webhooks)
- Stripe keys when ready

```bash
npm install
npm run dev
```

1. Create an account
2. Open `/portal` — free lessons + Pricing calculator + CEO scorecard
3. Go to **Pricing** → pick a plan (demo unlocks instantly when Stripe keys are absent; live Checkout when Stripe is configured)
4. Explore Courses, Calculators, Toolkit, Vault

## Go live on Netlify

1. Connect this GitHub repo
2. Add env vars from `.env.example`
3. Run `supabase/migrations/001_profiles.sql`
4. Create Stripe prices + webhook → `/.netlify/functions/stripe-webhook`

## Brand

Signature pink `#FF2D8B`, soft pink, energy yellow, clarity blue, clean, ink — DM Sans / Playfair Display / Inter.
