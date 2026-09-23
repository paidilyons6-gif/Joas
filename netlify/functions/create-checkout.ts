import type { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const siteUrl =
  process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

const PRICE_ENV: Record<string, string | undefined> = {
  office: process.env.STRIPE_PRICE_OFFICE,
  hotmess: process.env.STRIPE_PRICE_HOTMESS,
};

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
      email?: string;
    };

    const productId = (
      body.productId ||
      body.programId ||
      (body.kind === "office" ? "office" : "")
    ).toLowerCase();

    if (productId !== "office" && productId !== "hotmess") {
      return {
        statusCode: 400,
        body: 'Use productId "office" (one-time Office access) or "hotmess".',
      };
    }

    const priceId = PRICE_ENV[productId];
    if (!priceId) {
      return {
        statusCode: 500,
        body: `Missing Stripe price. Set STRIPE_PRICE_${productId.toUpperCase()} on Netlify (run npm run stripe:setup locally to create products).`,
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

    const successPath =
      productId === "office"
        ? "/portal?checkout=success"
        : `/programs?checkout=success&program=${productId}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(customerId
        ? { customer: customerId }
        : { customer_email: body.email }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}${successPath}`,
      cancel_url:
        productId === "office"
          ? `${siteUrl}/pricing?checkout=cancel`
          : `${siteUrl}/programs?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: {
        kind: productId === "office" ? "office" : "program",
        productId,
        plan: productId === "office" ? "monthly" : "",
      },
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
