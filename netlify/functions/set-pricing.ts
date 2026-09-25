import type { Handler } from "@netlify/functions";
import {
  formatDollars,
  getStripe,
  PRICE_LOOKUP,
  resolvePriceId,
  type CheckoutKind,
} from "./_stripePrices";

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "r.lyons1@icloud.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function mapKind(raw: string): CheckoutKind | null {
  const v = raw.toLowerCase();
  if (v === "lifetime" || v === "office" || v === "onetime") return "office";
  if (v === "monthly" || v === "month") return "monthly";
  if (v === "annual" || v === "yearly" || v === "year") return "annual";
  if (v === "hotmess") return "hotmess";
  return null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { statusCode: 503, body: "Stripe is not configured" };
  }

  const secret = process.env.STUDIO_PRICE_SECRET;
  if (!secret) {
    return {
      statusCode: 503,
      body: "Set STUDIO_PRICE_SECRET on Netlify to enable Studio price changes.",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}") as {
      kind?: string;
      amountDollars?: number | string;
      email?: string;
      secret?: string;
    };

    if (body.secret !== secret) {
      return { statusCode: 401, body: "Wrong Studio pricing password." };
    }

    const email = (body.email || "").toLowerCase().trim();
    if (!ADMIN_EMAILS.includes(email)) {
      return { statusCode: 403, body: "Only the Studio admin can change prices." };
    }

    const kind = mapKind(body.kind || "");
    if (!kind) {
      return {
        statusCode: 400,
        body: 'kind must be "monthly", "annual", "lifetime", or "hotmess".',
      };
    }

    const dollars = Number(body.amountDollars);
    if (!Number.isFinite(dollars) || dollars < 1) {
      return { statusCode: 400, body: "Enter a dollar amount of at least 1." };
    }
    const amountCents = Math.round(dollars * 100);

    const currentId = await resolvePriceId(stripe, kind);
    if (!currentId) {
      return { statusCode: 500, body: `No existing Stripe price for ${kind}.` };
    }

    const current = await stripe.prices.retrieve(currentId);
    if (current.unit_amount === amountCents && current.active) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: true,
          unchanged: true,
          priceId: current.id,
          priceLabel: formatDollars(amountCents),
        }),
      };
    }

    const lookupKey = PRICE_LOOKUP[kind];

    // Create the new price and move the lookup key from the old one.
    const created = await stripe.prices.create({
      product: String(current.product),
      unit_amount: amountCents,
      currency: current.currency || "usd",
      lookup_key: lookupKey,
      transfer_lookup_key: true,
      nickname: current.nickname || undefined,
      ...(current.recurring
        ? { recurring: { interval: current.recurring.interval } }
        : {}),
      metadata: {
        bbb: "true",
        lookup: lookupKey,
        replaced: current.id,
      },
    });

    if (current.active) {
      await stripe.prices.update(current.id, { active: false });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        priceId: created.id,
        priceLabel: formatDollars(amountCents),
        amountCents,
        kind,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : "Could not update price",
    };
  }
};
