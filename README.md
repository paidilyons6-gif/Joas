# Business by Becca

**Welcome to The Office.**

Portal + website for Bodies by Becca: **BodiesByBecca membership** (App Store / Play Store) unlocks The Office; **programs like HOTMESS** sell on the site.

## Model

| What | Where it bills | What it unlocks |
|---|---|---|
| Free account | — | Sign up only |
| **BodiesByBecca membership** | Apple App Store / Google Play | The Office (courses, tools, vault, community) |
| **Programs (HOTMESS…)** | Website (Stripe when connected) | That program purchase |

Challenges wrap after **October**; ongoing access is BodiesByBecca membership in the app.

## Stack

- Vite + React + React Router
- Supabase optional (demo works without keys)
- App Store / Play links for membership
- Stripe optional for website program checkout
- Netlify host

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Admin Studio: `r.lyons1@icloud.com`

See **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** for store links + HOTMESS Stripe price.

## Static zip

`business_by_becca_static.zip` — drag onto Netlify Drop for a frontend preview.
