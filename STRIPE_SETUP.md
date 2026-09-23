# Stripe setup (The Office + HOTMESS)

I **cannot** read Netlify env vars from this agent or use secret keys from chat.

## Option A — Dashboard (fastest)

1. Stripe → **Products** → **Add product**
2. **The Office — one-time access**
   - Pricing: **One time** (set your amount)
   - Copy Price ID `price_…` → Netlify `STRIPE_PRICE_OFFICE`
3. **HOTMESS**
   - Pricing: **One time**
   - Copy Price ID → Netlify `STRIPE_PRICE_HOTMESS`
4. Also on Netlify:
   - `STRIPE_SECRET_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET` (webhook URL `/.netlify/functions/stripe-webhook`, event `checkout.session.completed`)
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (so Office purchase unlocks `profiles.plan`)
5. **Trigger deploy**

## Option B — Script (creates products for you)

On your computer (key stays local):

```bash
# in project folder — .env is gitignored
echo 'STRIPE_SECRET_KEY=sk_live_YOUR_NEW_KEY' >> .env
npm run stripe:setup
```

It prints `STRIPE_PRICE_OFFICE` and `STRIPE_PRICE_HOTMESS` — paste those into Netlify, then redeploy.

Default script amounts: Office **$197**, HOTMESS **$97** (change anytime in Stripe).

## What the site does

| Product | Where | Stripe mode | Effect |
|---|---|---|---|
| The Office | `/pricing` → Buy The Office | one-time `payment` | Webhook sets membership → portal unlocks |
| HOTMESS | `/programs` | one-time `payment` | Program purchase (doesn’t change membership) |
| BodiesByBecca | App Store / Play | in-app | Recurring membership after October |
