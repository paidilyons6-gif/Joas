# Business by Becca / The Office

Portal + website: **The Office** is the home base; **programs** sell on the site and unlock portal content.

| Product | Where | Unlocks |
|---|---|---|
| Programs (Studio) | Website (Stripe) | That purchase → portal access |
| Member courses | Portal (Studio CMS) | Content for program buyers |

## Stack

Vite + React + TypeScript · Netlify Functions · Stripe Checkout · optional Supabase

## Local

```bash
npm install
npm run dev
```

## Stripe / Studio

See **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** — Becky creates and prices programs in Studio; Stripe syncs automatically.
