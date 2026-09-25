export type PricingOfferKey = "monthly" | "annual" | "lifetime" | "hotmess";

export type PricingOffer = {
  /** What visitors see, e.g. "$49" */
  priceLabel: string;
  /** Optional suffix like "/month" */
  priceSuffix?: string;
  /** Short line under the price */
  blurb?: string;
  /**
   * Stripe Price ID from Dashboard (price_…).
   * Leave blank to use the default wired on Netlify.
   */
  stripePriceId?: string;
};

export type SitePricing = Record<PricingOfferKey, PricingOffer>;

export const DEFAULT_SITE_PRICING: SitePricing = {
  monthly: {
    priceLabel: "$49",
    priceSuffix: "/month",
    blurb: "Month to month. Cancel anytime.",
  },
  annual: {
    priceLabel: "$397",
    priceSuffix: "/year",
    blurb: "Save vs paying monthly all year.",
  },
  lifetime: {
    priceLabel: "$597",
    blurb: "One payment. Keep The Office — no renewals.",
  },
  hotmess: {
    priceLabel: "$97",
    blurb: "One-time program purchase on the website.",
  },
};

export const PRICING_OFFER_META: Record<
  PricingOfferKey,
  { title: string; kind: string; stripeHint: string }
> = {
  monthly: {
    title: "Office — Monthly",
    kind: "Recurring subscription",
    stripeHint: "Stripe → Products → The Office → add Monthly price",
  },
  annual: {
    title: "Office — Yearly",
    kind: "Recurring subscription",
    stripeHint: "Stripe → Products → The Office → add Yearly price",
  },
  lifetime: {
    title: "Office — Lifetime",
    kind: "One-time payment",
    stripeHint: "Stripe → Products → The Office → add one-time Lifetime price",
  },
  hotmess: {
    title: "HOTMESS program",
    kind: "One-time program",
    stripeHint: "Stripe → Products → HOTMESS → add one-time price",
  },
};

const PRICING_KEY = "bbb_site_pricing_v1";

function mergePricing(partial?: Partial<SitePricing> | null): SitePricing {
  const next = { ...DEFAULT_SITE_PRICING };
  if (!partial) return next;
  for (const key of Object.keys(DEFAULT_SITE_PRICING) as PricingOfferKey[]) {
    if (partial[key]) {
      next[key] = { ...DEFAULT_SITE_PRICING[key], ...partial[key] };
    }
  }
  return next;
}

function readLocal(): SitePricing {
  try {
    const raw = localStorage.getItem(PRICING_KEY);
    if (!raw) return { ...DEFAULT_SITE_PRICING };
    return mergePricing(JSON.parse(raw) as Partial<SitePricing>);
  } catch {
    return { ...DEFAULT_SITE_PRICING };
  }
}

export const sitePricingStore = {
  get(): SitePricing {
    return readLocal();
  },
  save(pricing: SitePricing) {
    localStorage.setItem(PRICING_KEY, JSON.stringify(pricing));
    window.dispatchEvent(new Event("bbb-pricing-updated"));
    return pricing;
  },
  merge: mergePricing,
};
