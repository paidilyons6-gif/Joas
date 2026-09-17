import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!stripeSecret || !webhookSecret) {
    return { statusCode: 503, body: "Stripe webhook is not configured" };
  }

  const stripe = new Stripe(stripeSecret);
  const signature = event.headers["stripe-signature"];
  if (!signature) {
    return { statusCode: 400, body: "Missing stripe-signature" };
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body || "",
      signature,
      webhookSecret,
    );
  } catch (error) {
    return {
      statusCode: 400,
      body: error instanceof Error ? error.message : "Invalid signature",
    };
  }

  if (
    stripeEvent.type === "checkout.session.completed" ||
    stripeEvent.type === "customer.subscription.updated"
  ) {
    const obj = stripeEvent.data.object as
      | Stripe.Checkout.Session
      | Stripe.Subscription;
    const email =
      "customer_details" in obj
        ? obj.customer_details?.email
        : undefined;
    const metadataPlan =
      "metadata" in obj ? (obj.metadata?.plan as string | undefined) : undefined;
    const plan = metadataPlan === "annual" ? "annual" : "monthly";

    if (email && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from("profiles")
        .update({ plan })
        .eq("email", email.toLowerCase());
    }
  }

  if (stripeEvent.type === "customer.subscription.deleted") {
    const sub = stripeEvent.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer) && customer.email && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from("profiles")
        .update({ plan: "none" })
        .eq("email", customer.email.toLowerCase());
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
