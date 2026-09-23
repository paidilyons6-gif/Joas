# Stripe setup (The Office + HOTMESS)

I **cannot** read Netlify env vars from this agent or use secret keys from chat.

## Option A — Dashboard (fastest)

1. Stripe → **Products** → **Add product** (or edit existing **The Office**)
2. **The Office — prices** (same product, three prices)
   - **Monthly** subscription → `$49` / month → Netlify `STRIPE_PRICE_MONTHLY`
   - **Yearly** subscription → `$397` / year → Netlify `STRIPE_PRICE_ANNUAL`
   - **Lifetime** one-time → `$597` → Netlify `STRIPE_PRICE_OFFICE`
3. **HOTMESS** (optional program)
   - Pricing: **One time**
   - Copy Price ID → Netlify `STRIPE_PRICE_HOTMESS`
4. Also on Netlify:
   - `STRIPE_SECRET_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET` (webhook URL `/.netlify/functions/stripe-webhook`)
     - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (so purchase unlocks `profiles.plan`)
5. **Trigger deploy**

## Option B — Script (creates products for you)

On your computer (key stays local):

```bash
# in project folder — .env is gitignored
echo 'STRIPE_SECRET_KEY=sk_live_YOUR_NEW_KEY' >> .env
npm run stripe:setup
```

It prints `STRIPE_PRICE_OFFICE`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, and `STRIPE_PRICE_HOTMESS` — paste those into Netlify, then redeploy.

Default script amounts: Office lifetime **$597**, monthly **$49**, yearly **$397**, HOTMESS **$97** (change anytime in Stripe).

## Price ladder (why these numbers)

| Option | Price | Why |
|---|---|---|
| Monthly | $49/mo | Flexible — cancel anytime |
| Yearly | $397/yr | Save $191 vs $588 monthly |
| Lifetime | $597 once | Above yearly — permanent access, no renewals |

## What the site does

| Product | Where | Stripe mode | Effect |
|---|---|---|---|
| The Office monthly | `/pricing` → Subscribe monthly | `subscription` | Webhook sets `monthly` → portal unlocks |
| The Office yearly | `/pricing` → Subscribe yearly | `subscription` | Webhook sets `annual` → portal unlocks |
| The Office lifetime | `/pricing` → Buy lifetime | one-time `payment` | Webhook sets `annual` → permanent unlock |
| HOTMESS | `/programs` | one-time `payment` | Program purchase (doesn’t change membership) |
| BodiesByBecca | App Store / Play | in-app | Recurring membership after October |
