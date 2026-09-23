# Turn on real subscriptions (Stripe)

The site already supports **monthly ($49)** and **yearly ($397)** subscriptions via Stripe Checkout. Demo mode unlocks without cards; follow this to take real payments.

## 1. Create products in Stripe

1. Open [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create **Business by Becca — Monthly**
   - Recurring price: **$49 / month**
   - Copy the Price ID (`price_…`) → `STRIPE_PRICE_MONTHLY`
3. Create **Business by Becca — Yearly**
   - Recurring price: **$397 / year**
   - Copy the Price ID → `STRIPE_PRICE_ANNUAL`

## 2. API keys

From [Stripe API keys](https://dashboard.stripe.com/apikeys):

| Env var | Where |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` or `pk_test_…` (Netlify + `.env`) |
| `STRIPE_SECRET_KEY` | `sk_live_…` or `sk_test_…` (Netlify only — never commit) |

Start with **test mode** keys until a test card works (`4242…`).

## 3. Customer portal (cancel / update card)

1. Stripe → Settings → Billing → Customer portal
2. Enable cancel subscription + update payment method
3. Save

Members use **Account → Manage subscription**.

## 4. Webhook (unlocks membership after pay)

1. Stripe → Developers → Webhooks → Add endpoint
2. URL: `https://YOUR-SITE.netlify.app/.netlify/functions/stripe-webhook`
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

Also set on Netlify:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (so the webhook can set `profiles.plan`)

## 5. Netlify deploy (important)

**Netlify Drop (zip upload) does not run serverless functions** — card checkout needs a Git-connected site.

1. Netlify → Add new site → Import from Git → this repo
2. Branch: `cursor/becca-businesses-website-00ef` (or `main` after merge)
3. Build: `npm run build` · Publish: `dist` · Functions: `netlify/functions`
4. Site settings → Environment variables → paste all keys from `.env.example`
5. Deploy

## 6. Test

1. Visit `/pricing` → **Subscribe monthly**
2. Use test card `4242 4242 4242 4242`
3. Land on `/portal?checkout=success` with membership unlocked
4. Account → Manage subscription → cancel in test mode

## Plans in the product

| Plan | Price | Access |
|---|---|---|
| Free account | $0 | Preview lessons + Pricing calculator + CEO scorecard |
| Monthly | $49/mo | Full Office |
| Yearly | $397/yr | Full Office + founding perks |

Admin email `r.lyons1@icloud.com` always gets Studio access regardless of plan.
