# Stripe + Studio (programs-first)

## Model

- **The Office** = free home / portal shell  
- **Programs** = what people buy (one-time or subscription)  
- Buying any program unlocks portal content for that account  
- Live unlocks are granted only by the Stripe webhook (not the browser)

## Becca (Studio) — hands-off for you

1. Sign in as admin (`r.lyons1@icloud.com`) → **Portal → Studio**  
2. Enter Studio pricing password (`STUDIO_PRICE_SECRET`)  
3. **Programs** — create / edit / archive  
   - Name, price, billing (one-time / monthly / yearly), blurb, features  
4. Save → Stripe product + price update automatically  
5. Shows on `/programs` immediately  
6. Publish courses under Studio → Courses so customers see them in The Office  
7. Use **View as client** to preview the locked shop/portal experience  

No Stripe Price IDs. No Netlify redeploy for new products.

## Customer path

1. Free sign-up  
2. `/programs` → buy a program (Stripe Checkout)  
3. Return → webhook grants entitlement → portal content opens  

## Required Netlify env (launch)

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Live auth + profiles |
| `VITE_ADMIN_EMAILS` | Studio access (default `r.lyons1@icloud.com`) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Webhook writes `profiles.programs` |
| `STRIPE_SECRET_KEY` | Checkout + product CRUD |
| `STRIPE_WEBHOOK_SECRET` | Verify `/.netlify/functions/stripe-webhook` |
| `STUDIO_PRICE_SECRET` | Password gate for Studio product mutations |

## Webhook

Point Stripe to:

`https://YOUR_DOMAIN/.netlify/functions/stripe-webhook`

Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Supabase

Apply migrations through `006_protect_programs.sql` so clients cannot self-grant `profiles.programs`.
