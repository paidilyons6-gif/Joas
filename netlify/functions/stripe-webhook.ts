import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecret =
  process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function grantProgramByEmail(
  email: string,
  slug: string,
  stripeCustomerId?: string | null,
) {
  const supabase = adminClient();
  if (!supabase || !slug) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, programs")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!profile) return;

  const current = Array.isArray(profile.programs)
    ? (profile.programs as string[])
    : [];
  const next = current.includes(slug) ? current : [...current, slug];
  const patch: Record<string, unknown> = { programs: next };
  if (stripeCustomerId) patch.stripe_customer_id = stripeCustomerId;

  await supabase.from("profiles").update(patch).eq("id", profile.id);
}

async function revokeProgramByEmail(email: string, slug: string) {
  const supabase = adminClient();
  if (!supabase || !slug) return;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, programs")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (!profile) return;
  const current = Array.isArray(profile.programs)
    ? (profile.programs as string[])
    : [];
  const next = current.filter((p) => p !== slug);
  await supabase.from("profiles").update({ programs: next }).eq("id", profile.id);
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
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    const slug =
      session.metadata?.productId ||
      session.metadata?.program ||
      undefined;

    if (email && slug && session.metadata?.kind === "program") {
      await grantProgramByEmail(email, slug, customerId);
    }
  }

  if (stripeEvent.type === "customer.subscription.updated") {
    const sub = stripeEvent.data.object as Stripe.Subscription;
    const slug = sub.metadata?.program;
    if (!slug) {
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer) && customer.email) {
      const active =
        sub.status === "active" ||
        sub.status === "trialing" ||
        sub.status === "past_due";
      if (active) await grantProgramByEmail(customer.email, slug, customerId);
      else await revokeProgramByEmail(customer.email, slug);
    }
  }

  if (stripeEvent.type === "customer.subscription.deleted") {
    const sub = stripeEvent.data.object as Stripe.Subscription;
    const slug = sub.metadata?.program;
    if (slug) {
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const customer = await stripe.customers.retrieve(customerId);
      if (!("deleted" in customer) && customer.email) {
        await revokeProgramByEmail(customer.email, slug);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
