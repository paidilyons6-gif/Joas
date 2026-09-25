import type { Handler } from "@netlify/functions";
import { getStripe } from "./_stripePrices";

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "r.lyons1@icloud.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
      body: "Set STUDIO_PRICE_SECRET on Netlify to enable Studio product edits.",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}") as {
      email?: string;
      secret?: string;
      productId?: string;
    };

    if (body.secret !== secret) {
      return { statusCode: 401, body: "Wrong Studio pricing password." };
    }
    const email = (body.email || "").toLowerCase().trim();
    if (!ADMIN_EMAILS.includes(email)) {
      return {
        statusCode: 403,
        body: "Only the Studio admin can manage products.",
      };
    }
    if (!body.productId) {
      return { statusCode: 400, body: "productId is required." };
    }

    await stripe.products.update(body.productId, { active: false });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, archived: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : "Could not archive product",
    };
  }
};
