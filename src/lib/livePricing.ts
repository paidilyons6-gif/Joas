import type { OfficeOfferId } from "../data/officeOffers";
import { OFFICE_OFFERS } from "../data/officeOffers";
import { DEFAULT_SITE_PRICING } from "./sitePricing";

export type LiveOffer = {
  kind: string;
  priceId: string;
  amountCents: number;
  priceLabel: string;
  priceSuffix?: string;
  interval?: string | null;
};

export type LivePricing = {
  monthly?: LiveOffer;
  annual?: LiveOffer;
  lifetime?: LiveOffer;
  hotmess?: LiveOffer;
};

export async function fetchLivePricing(): Promise<LivePricing | null> {
  try {
    const res = await fetch("/.netlify/functions/get-pricing");
    if (!res.ok) return null;
    const data = (await res.json()) as { offers?: LivePricing };
    return data.offers || null;
  } catch {
    return null;
  }
}

export function officeDisplay(
  id: OfficeOfferId,
  live: LivePricing | null,
): { priceLabel: string; priceSuffix?: string; blurb: string } {
  const fallback = OFFICE_OFFERS[id];
  const liveKey = id;
  const offer = live?.[liveKey];
  return {
    priceLabel: offer?.priceLabel || fallback.priceLabel,
    priceSuffix: offer?.priceSuffix ?? fallback.priceSuffix,
    blurb: fallback.blurb,
  };
}

export function hotmessDisplay(live: LivePricing | null) {
  return {
    priceLabel:
      live?.hotmess?.priceLabel || DEFAULT_SITE_PRICING.hotmess.priceLabel,
    blurb: DEFAULT_SITE_PRICING.hotmess.blurb,
  };
}

export async function setLivePrice(input: {
  kind: "monthly" | "annual" | "lifetime" | "hotmess";
  amountDollars: number;
  email: string;
  secret: string;
}) {
  const res = await fetch("/.netlify/functions/set-pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Could not update price");
  return JSON.parse(text) as {
    ok: boolean;
    priceLabel: string;
    priceId: string;
    unchanged?: boolean;
  };
}
