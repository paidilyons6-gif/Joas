import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function setPlanByEmail(
  email: string,
  plan: "none" | "monthly" | "annual",
  stripeCustomerId?: string | null,
) {
  const supabase = adminClient();
  if (!supabase) return;
  const patch: Record<string, string> = { plan };
  if (stripeCustomerId) patch.stripe_customer_id = stripeCustomerId;
  await supabase
    .from("profiles")
    .update(patch)
    .eq("email", email.toLowerCase());
}

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

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const email =
      session.customer_details?.email ||
      session.customer_email ||
      undefined;
    const plan = session.metadata?.plan === "annual" ? "annual" : "monthly";
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    if (email) await setPlanByEmail(email, plan, customerId);
  }

  if (stripeEvent.type === "customer.subscription.updated") {
    const sub = stripeEvent.data.object as Stripe.Subscription;
    const plan = sub.metadata?.plan === "annual" ? "annual" : "monthly";
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer) && customer.email) {
      const active =
        sub.status === "active" ||
        sub.status === "trialing" ||
        sub.status === "past_due";
      await setPlanByEmail(
        customer.email,
        active ? plan : "none",
        customerId,
      );
    }
  }

  if (stripeEvent.type === "customer.subscription.deleted") {
    const sub = stripeEvent.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer) && customer.email) {
      await setPlanByEmail(customer.email, "none", customerId);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
