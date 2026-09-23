import type { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripeSecret =
  process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key;
const siteUrl =
  process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

const PRICE_ENV: Record<string, string | undefined> = {
  office: process.env.STRIPE_PRICE_OFFICE,
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
  hotmess: process.env.STRIPE_PRICE_HOTMESS,
};

type CheckoutKind = "office" | "monthly" | "annual" | "hotmess";

function resolveKind(body: {
  kind?: string;
  productId?: string;
  programId?: string;
  plan?: string;
}): CheckoutKind | null {
  const raw = (
    body.productId ||
    body.programId ||
    body.plan ||
    body.kind ||
    ""
  ).toLowerCase();
  if (raw === "office" || raw === "onetime" || raw === "one-time") return "office";
  if (raw === "monthly" || raw === "month") return "monthly";
  if (raw === "annual" || raw === "yearly" || raw === "year") return "annual";
  if (raw === "hotmess") return "hotmess";
  return null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!stripeSecret) {
    return {
      statusCode: 503,
      body: "Stripe is not configured. Set STRIPE_SECRET_KEY on Netlify.",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}") as {
      kind?: string;
      productId?: string;
      programId?: string;
      plan?: string;
      email?: string;
    };

    const kind = resolveKind(body);
    if (!kind) {
      return {
        statusCode: 400,
        body: 'Use productId "office" (one-time), "monthly", "annual", or "hotmess".',
      };
    }

    const priceId = PRICE_ENV[kind];
    if (!priceId) {
      return {
        statusCode: 500,
        body: `Missing Stripe price. Set STRIPE_PRICE_${kind.toUpperCase()} on Netlify.`,
      };
    }

    const stripe = new Stripe(stripeSecret);

    let customerId: string | undefined;
    if (body.email) {
      const existing = await stripe.customers.list({
        email: body.email,
        limit: 1,
      });
      if (existing.data[0]) customerId = existing.data[0].id;
    }

    const isSubscription = kind === "monthly" || kind === "annual";
    const unlocksOffice = kind === "office" || isSubscription;
    // Lifetime one-time maps to annual in profiles (permanent unlock flag).
    const planMeta =
      kind === "annual" || kind === "office"
        ? "annual"
        : kind === "monthly"
          ? "monthly"
          : "";

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      ...(customerId
        ? { customer: customerId }
        : { customer_email: body.email }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: unlocksOffice
        ? `${siteUrl}/portal?checkout=success`
        : `${siteUrl}/programs?checkout=success&program=${kind}`,
      cancel_url: unlocksOffice
        ? `${siteUrl}/pricing?checkout=cancel`
        : `${siteUrl}/programs?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: {
        kind: unlocksOffice
          ? isSubscription
            ? "subscription"
            : "office"
          : "program",
        productId: kind,
        plan: planMeta,
      },
      ...(isSubscription
        ? { subscription_data: { metadata: { plan: planMeta } } }
        : {}),
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : "Checkout error",
    };
  }
};
