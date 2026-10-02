import type { Handler } from "@netlify/functions";
import { getStripe, loadOfferSnapshot, type CheckoutKind } from "./_stripePrices";

const KINDS: CheckoutKind[] = ["monthly", "annual", "office"];

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { statusCode: 503, body: "Stripe is not configured" };
  }

  try {
    const offers: Record<string, unknown> = {};
    for (const kind of KINDS) {
      const snap = await loadOfferSnapshot(stripe, kind);
      if (snap) offers[kind === "office" ? "lifetime" : kind] = snap;
    }
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
      body: JSON.stringify({ offers }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : "Pricing error",
    };
  }
};
