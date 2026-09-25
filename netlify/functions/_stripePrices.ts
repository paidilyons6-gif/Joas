import Stripe from "stripe";

export type CheckoutKind = "office" | "monthly" | "annual" | "hotmess";

export const PRICE_LOOKUP: Record<CheckoutKind, string> = {
  office: "bbb_office_lifetime",
  monthly: "bbb_office_monthly",
  annual: "bbb_office_annual",
  hotmess: "bbb_hotmess_onetime",
};

export const PRICE_ENV_KEYS: Record<CheckoutKind, string> = {
  office: "STRIPE_PRICE_OFFICE",
  monthly: "STRIPE_PRICE_MONTHLY",
  annual: "STRIPE_PRICE_ANNUAL",
  hotmess: "STRIPE_PRICE_HOTMESS",
};

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key;
  if (!key) return null;
  return new Stripe(key);
}

export async function resolvePriceId(
  stripe: Stripe,
  kind: CheckoutKind,
): Promise<string | null> {
  const lookup = PRICE_LOOKUP[kind];
  const byLookup = await stripe.prices.list({
    lookup_keys: [lookup],
    active: true,
    limit: 1,
  });
  if (byLookup.data[0]) return byLookup.data[0].id;

  const envId = process.env[PRICE_ENV_KEYS[kind]];
  return envId || null;
}

export function formatDollars(cents: number) {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export async function loadOfferSnapshot(stripe: Stripe, kind: CheckoutKind) {
  const priceId = await resolvePriceId(stripe, kind);
  if (!priceId) return null;
  const price = await stripe.prices.retrieve(priceId);
  const amount = price.unit_amount || 0;
  const interval = price.recurring?.interval;
  return {
    kind,
    priceId: price.id,
    amountCents: amount,
    priceLabel: formatDollars(amount),
    priceSuffix:
      interval === "month" ? "/month" : interval === "year" ? "/year" : undefined,
    interval: interval || null,
    lookupKey: PRICE_LOOKUP[kind],
  };
}
