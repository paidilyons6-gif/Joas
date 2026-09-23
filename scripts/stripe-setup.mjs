#!/usr/bin/env node
/**
 * Creates Stripe products/prices for The Office (one-time + subscriptions) + HOTMESS.
 * Run locally with your key in .env (gitignored) — never paste keys into chat.
 *
 *   echo 'STRIPE_SECRET_KEY=sk_live_...' >> .env
 *   npm run stripe:setup
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

function loadEnv() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error(
    "Missing STRIPE_SECRET_KEY. Add it to .env (gitignored), then re-run:\n  npm run stripe:setup",
  );
  process.exit(1);
}
if (key.includes("IrrssOVBYl") || key.length < 20) {
  console.error("Refusing to use a leaked/invalid key. Roll a new key in Stripe first.");
  process.exit(1);
}

const stripe = new Stripe(key);

async function findPriceByLookup(lookupKey) {
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  return existing.data[0] || null;
}

async function ensureOfficeProduct() {
  const products = await stripe.products.search({
    query: "metadata['bbb']:'true' AND metadata['role']:'office'",
    limit: 1,
  });
  if (products.data[0]) return products.data[0];

  // Fall back: reuse product from any existing Office price
  for (const key of [
    "bbb_office_lifetime",
    "bbb_office_monthly",
    "bbb_office_annual",
    "bbb_office_onetime",
  ]) {
    const price = await findPriceByLookup(key);
    if (price) {
      return await stripe.products.retrieve(String(price.product));
    }
  }

  return stripe.products.create({
    name: "The Office",
    description:
      "Business by Becca — The Office membership (subscribe or pay once).",
    metadata: { bbb: "true", role: "office" },
  });
}

async function ensurePrice(opts) {
  const { productId, amountCents, lookupKey, recurring } = opts;
  const existing = await findPriceByLookup(lookupKey);
  if (existing) {
    return { priceId: existing.id, created: false };
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amountCents,
    currency: "usd",
    lookup_key: lookupKey,
    ...(recurring ? { recurring } : {}),
    metadata: { bbb: "true", lookup: lookupKey },
  });
  return { priceId: price.id, created: true };
}

async function ensureOneTimeProduct(opts) {
  const { name, description, amountCents, lookupKey } = opts;
  const existing = await findPriceByLookup(lookupKey);
  if (existing) {
    return {
      productId: String(existing.product),
      priceId: existing.id,
      created: false,
    };
  }

  const product = await stripe.products.create({
    name,
    description,
    metadata: { bbb: "true", lookup: lookupKey },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: "usd",
    lookup_key: lookupKey,
    metadata: { bbb: "true", lookup: lookupKey },
  });
  return { productId: product.id, priceId: price.id, created: true };
}

const officeProduct = await ensureOfficeProduct();

const office = await ensurePrice({
  productId: officeProduct.id,
  amountCents: 59700, // $597 lifetime
  lookupKey: "bbb_office_lifetime",
});

const monthly = await ensurePrice({
  productId: officeProduct.id,
  amountCents: 4900, // $49 / month
  lookupKey: "bbb_office_monthly",
  recurring: { interval: "month" },
});

const annual = await ensurePrice({
  productId: officeProduct.id,
  amountCents: 39700, // $397 / year
  lookupKey: "bbb_office_annual",
  recurring: { interval: "year" },
});

const hotmess = await ensureOneTimeProduct({
  name: "HOTMESS",
  description: "HOTMESS program — sold on the website.",
  amountCents: 9700, // $97
  lookupKey: "bbb_hotmess_onetime",
});

console.log(`
Stripe products ready.

Add these to Netlify → Site configuration → Environment variables:

  STRIPE_PRICE_OFFICE=${office.priceId}
  STRIPE_PRICE_MONTHLY=${monthly.priceId}
  STRIPE_PRICE_ANNUAL=${annual.priceId}
  STRIPE_PRICE_HOTMESS=${hotmess.priceId}

Also ensure you already have:
  STRIPE_SECRET_KEY=(your secret key)
  VITE_STRIPE_PUBLISHABLE_KEY=(pk_live_... or pk_test_...)
  STRIPE_WEBHOOK_SECRET=(from webhook endpoint)
  SUPABASE_URL=...
  SUPABASE_SERVICE_ROLE_KEY=...

Then Trigger deploy (clear cache).

Office lifetime: ${office.created ? "created" : "reused"}  ${office.priceId}
Office monthly:  ${monthly.created ? "created" : "reused"}  ${monthly.priceId}
Office yearly:   ${annual.created ? "created" : "reused"}  ${annual.priceId}
HOTMESS:         ${hotmess.created ? "created" : "reused"} ${hotmess.priceId}
`);
