import type { Handler } from "@netlify/functions";
import {
  findSellableBySlug,
  getStripe,
} from "./_stripePrices";

const siteUrl =
  process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

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

    // Ignore legacy Office membership kinds — programs only
    if (
      raw === "office" ||
      raw === "monthly" ||
      raw === "annual" ||
      raw === "lifetime" ||
      raw === "year" ||
      raw === "month"
    ) {
      return {
        statusCode: 400,
        body: "Office membership is retired. Buy a program instead (productId = program slug).",
      };
    }

    if (!raw || raw === "program" || raw === "subscription") {
      return {
        statusCode: 400,
        body: 'Send productId with the program slug (e.g. "hotmess").',
      };
    }

    const program = await findSellableBySlug(stripe, raw);
    if (!program) {
      return {
        statusCode: 404,
        body: `No active program found for "${raw}". Create it in Studio → Programs.`,
      };
    }

    const isSubscription =
      program.interval === "month" || program.interval === "year";

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
      line_items: [{ price: program.priceId, quantity: 1 }],
      success_url: `${siteUrl}/programs?checkout=success&program=${program.slug}`,
      cancel_url: `${siteUrl}/programs?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: {
        kind: "program",
        productId: program.slug,
        plan: "",
      },
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: { program: program.slug, kind: "program" },
            },
          }
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
