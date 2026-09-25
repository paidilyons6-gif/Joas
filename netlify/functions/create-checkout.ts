import type { Handler } from "@netlify/functions";
import {
  findSellableBySlug,
  getStripe,
  resolvePriceId,
  type OfficeKind,
} from "./_stripePrices";

const siteUrl =
  process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

function resolveOfficeKind(raw: string): OfficeKind | null {
  const v = raw.toLowerCase();
  if (v === "office" || v === "onetime" || v === "one-time" || v === "lifetime")
    return "office";
  if (v === "monthly" || v === "month") return "monthly";
  if (v === "annual" || v === "yearly" || v === "year") return "annual";
  return null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const stripe = getStripe();
  if (!stripe) {
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

    const raw = (
      body.productId ||
      body.programId ||
      body.plan ||
      body.kind ||
      ""
    ).toLowerCase();

    if (!raw) {
      return {
        statusCode: 400,
        body: 'Send productId for Office ("monthly", "annual", "office") or a program slug.',
      };
    }

    const officeKind = resolveOfficeKind(raw);
    let priceId: string | null = null;
    let isSubscription = false;
    let unlocksOffice = false;
    let planMeta = "";
    let productId = raw;
    let metaKind: "subscription" | "office" | "program" = "program";

    if (officeKind) {
      priceId = await resolvePriceId(stripe, officeKind);
      isSubscription = officeKind === "monthly" || officeKind === "annual";
      unlocksOffice = true;
      planMeta =
        officeKind === "annual" || officeKind === "office"
          ? "annual"
          : "monthly";
      productId = officeKind;
      metaKind = isSubscription ? "subscription" : "office";
    } else {
      const program = await findSellableBySlug(stripe, raw);
      if (!program) {
        return {
          statusCode: 404,
          body: `No active program found for "${raw}". Create it in Studio → Products.`,
        };
      }
      priceId = program.priceId;
      productId = program.slug;
      metaKind = "program";
    }

    if (!priceId) {
      return {
        statusCode: 500,
        body: `Missing Stripe price for ${productId}.`,
      };
    }

    let customerId: string | undefined;
    if (body.email) {
      const existing = await stripe.customers.list({
        email: body.email,
        limit: 1,
      });
      if (existing.data[0]) customerId = existing.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      ...(customerId
        ? { customer: customerId }
        : { customer_email: body.email }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: unlocksOffice
        ? `${siteUrl}/portal?checkout=success`
        : `${siteUrl}/programs?checkout=success&program=${productId}`,
      cancel_url: unlocksOffice
        ? `${siteUrl}/pricing?checkout=cancel`
        : `${siteUrl}/programs?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: {
        kind: metaKind,
        productId,
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
