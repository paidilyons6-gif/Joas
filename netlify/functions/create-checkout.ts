import type { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const siteUrl =
  process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

const PRICE_ENV: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
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
      plan?: string;
      email?: string;
    };
    const plan = body.plan === "annual" ? "annual" : "monthly";
    const priceId = PRICE_ENV[plan];
    if (!priceId) {
      return {
        statusCode: 500,
        body: `Missing Stripe price id for ${plan}. Set STRIPE_PRICE_${plan.toUpperCase()} on Netlify.`,
      };
    }

    const stripe = new Stripe(stripeSecret);

    // Reuse Stripe customer when possible so portal + renewals stay linked
    let customerId: string | undefined;
    if (body.email) {
      const existing = await stripe.customers.list({
        email: body.email,
        limit: 1,
      });
      if (existing.data[0]) {
        customerId = existing.data[0].id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(customerId
        ? { customer: customerId }
        : { customer_email: body.email }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/portal?checkout=success`,
      cancel_url: `${siteUrl}/pricing?checkout=cancel`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { plan },
      subscription_data: {
        metadata: { plan },
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
