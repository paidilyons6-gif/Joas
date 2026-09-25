# Stripe + Studio (programs-first)

## Model

- **The Office** = free home / portal shell  
- **Programs** = what people buy (one-time or subscription)  
- Buying a program unlocks portal content for that account  

## Becky (Studio) — hands-off for you

1. Sign in as admin → **Portal → Studio**  
2. Enter Studio pricing password  
3. **Programs** — create / edit / archive  
   - Name, price, billing (one-time / monthly / yearly), blurb, features  
4. Save → Stripe product + price update automatically  
5. Shows on `/programs` immediately  

No Stripe Price IDs. No Netlify redeploy for new products.

## Customer path

1. Free sign-up  
2. `/programs` → buy a program (Stripe Checkout)  
3. Return → program unlocks → portal content opens  

## Env (already on Netlify)

- `STRIPE_SECRET_KEY`  
- `STUDIO_PRICE_SECRET`  
- Optional: `STRIPE_WEBHOOK_SECRET` + Supabase for cross-device unlock after pay  
