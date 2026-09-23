import type { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const siteUrl =
  process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

/** Website sells programs (e.g. HOTMESS). Membership is App Store / Play Store. */
const PROGRAM_PRICE_ENV: Record<string, string | undefined> = {
  hotmess: process.env.STRIPE_PRICE_HOTMESS,
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!stripeSecret) {
    return {
      statusCode: 503,
      body: "Stripe is not configured for program checkout. Set STRIPE_SECRET_KEY on Netlify.",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}") as {
      kind?: string;
      plan?: string;
      programId?: string;
      email?: string;
    };

    // Legacy membership checkout blocked — membership is in-app
    if (body.kind !== "program" && !body.programId) {
      return {
        statusCode: 400,
        body: "BodiesByBecca membership is billed via App Store / Play Store. Use kind=program for HOTMESS and other website programs.",
      };
    }

    const programId = (body.programId || "hotmess").toLowerCase();
    const priceId = PROGRAM_PRICE_ENV[programId];
    if (!priceId) {
      return {
        statusCode: 500,
        body: `Missing Stripe price for program "${programId}". Set STRIPE_PRICE_${programId.toUpperCase()} on Netlify.`,
      };
    }

    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/programs?checkout=success&program=${programId}`,
      cancel_url: `${siteUrl}/programs?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: { kind: "program", programId },
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
