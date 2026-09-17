import type { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

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
    const body = JSON.parse(event.body || "{}") as { email?: string };
    if (!body.email) {
      return { statusCode: 400, body: "Email required" };
    }

    const stripe = new Stripe(stripeSecret);
    const customers = await stripe.customers.list({
      email: body.email,
      limit: 1,
    });
    const customer = customers.data[0];
    if (!customer) {
      return { statusCode: 404, body: "No Stripe customer found for that email" };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${siteUrl}/portal/account`,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : "Portal error",
    };
  }
};
