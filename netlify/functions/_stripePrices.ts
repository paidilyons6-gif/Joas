import Stripe from "stripe";

export type OfficeKind = "office" | "monthly" | "annual";
export type CheckoutKind = OfficeKind;

export const PRICE_LOOKUP: Record<CheckoutKind, string> = {
  office: "bbb_office_lifetime",
  monthly: "bbb_office_monthly",
  annual: "bbb_office_annual",
};

export const PRICE_ENV_KEYS: Record<CheckoutKind, string> = {
  office: "STRIPE_PRICE_OFFICE",
  monthly: "STRIPE_PRICE_MONTHLY",
  annual: "STRIPE_PRICE_ANNUAL",
};

export type SellableProduct = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  badge: string;
  features: string[];
  amountCents: number;
  priceLabel: string;
  priceId: string;
  productId: string;
  lookupKey: string;
  active: boolean;
  /** one_time | month | year */
  interval: "one_time" | "month" | "year";
};

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key;
  if (!key) return null;
  return new Stripe(key);
}

export function formatDollars(cents: number) {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function programLookupKey(slug: string) {
  return `bbb_program_${slug}`;
}

function parseFeatures(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean).slice(0, 12);
    }
  } catch {
    /* fall through */
  }
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function serializeFeatures(features: string[]) {
  const cleaned = features.map((f) => f.trim()).filter(Boolean).slice(0, 12);
  const json = JSON.stringify(cleaned);
  if (json.length <= 490) return json;
  return cleaned.join("|").slice(0, 490);
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

async function activePriceForProduct(stripe: Stripe, product: Stripe.Product) {
  if (typeof product.default_price === "string") {
    const price = await stripe.prices.retrieve(product.default_price);
    if (price.active && !price.recurring) return price;
  }
  if (product.default_price && typeof product.default_price !== "string") {
    if (product.default_price.active && !product.default_price.recurring) {
      return product.default_price;
    }
  }
  const listed = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 10,
  });
  return listed.data.find((p) => !p.recurring) || listed.data[0] || null;
}

function toSellable(
  product: Stripe.Product,
  price: Stripe.Price,
): SellableProduct {
  const slug =
    product.metadata.bbb_slug ||
    slugify(product.name) ||
    product.id.replace(/^prod_/, "").toLowerCase();
  const intervalMeta = product.metadata.bbb_interval;
  const interval: SellableProduct["interval"] =
    price.recurring?.interval === "month"
      ? "month"
      : price.recurring?.interval === "year"
        ? "year"
        : intervalMeta === "month" || intervalMeta === "year"
          ? intervalMeta
          : "one_time";
  const suffix =
    interval === "month" ? "/mo" : interval === "year" ? "/yr" : "";
  return {
    id: slug,
    slug,
    name: product.name,
    blurb: product.metadata.bbb_blurb || product.description || "",
    badge: product.metadata.bbb_badge || "Program",
    features: parseFeatures(product.metadata.bbb_features),
    amountCents: price.unit_amount || 0,
    priceLabel: `${formatDollars(price.unit_amount || 0)}${suffix}`,
    priceId: price.id,
    productId: product.id,
    lookupKey: product.metadata.bbb_lookup || programLookupKey(slug),
    active: product.active,
    interval,
  };
}

/** All active sellable website programs (one-time). */
export async function listSellableProducts(
  stripe: Stripe,
  opts?: { includeInactive?: boolean },
): Promise<SellableProduct[]> {
  const products: SellableProduct[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < 5; page++) {
    const batch = await stripe.products.list({
      limit: 100,
      starting_after: startingAfter,
      active: opts?.includeInactive ? undefined : true,
    });
    for (const product of batch.data) {
      if (product.metadata.bbb_role !== "program") continue;
      if (!opts?.includeInactive && !product.active) continue;
      const price = await activePriceForProduct(stripe, product);
      if (!price) continue;
      products.push(toSellable(product, price));
    }
    if (!batch.has_more) break;
    startingAfter = batch.data[batch.data.length - 1]?.id;
  }
  products.sort((a, b) => a.name.localeCompare(b.name));
  return products;
}

export async function findSellableBySlug(
  stripe: Stripe,
  slug: string,
): Promise<SellableProduct | null> {
  const normalized = slugify(slug);
  if (!normalized) return null;

  // Prefer lookup key for Studio programs
  const lookup = programLookupKey(normalized);
  const byLookup = await stripe.prices.list({
    lookup_keys: [lookup],
    active: true,
    limit: 1,
  });
  if (byLookup.data[0]) {
    const price = byLookup.data[0];
    const product = await stripe.products.retrieve(String(price.product));
    if (!product.active) return null;
    return toSellable(product, price);
  }

  const all = await listSellableProducts(stripe, { includeInactive: false });
  return all.find((p) => p.slug === normalized) || null;
}
