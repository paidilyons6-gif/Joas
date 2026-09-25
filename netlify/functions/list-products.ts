import type { Handler } from "@netlify/functions";
import { getStripe, listSellableProducts } from "./_stripePrices";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { statusCode: 503, body: "Stripe is not configured" };
  }

  try {
    const includeInactive =
      event.queryStringParameters?.all === "1" ||
      event.queryStringParameters?.all === "true";
    const products = await listSellableProducts(stripe, { includeInactive });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({ products }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : "Could not list products",
    };
  }
};
