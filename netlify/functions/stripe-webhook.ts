import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const stripeSecret =
  process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

type GrantResult = {
  ok: boolean;
  email: string;
  slug: string;
  reason?: string;
  createdProfile?: boolean;
};

async function findAuthUserId(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.toLowerCase();
  // Paginate a bit — Office is small; enough for unlock reliability
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find(
      (u) => (u.email || "").toLowerCase() === normalized,
    );
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function grantProgramByEmail(
  email: string,
  slug: string,
  stripeCustomerId?: string | null,
): Promise<GrantResult> {
  const normalized = email.trim().toLowerCase();
  const supabase = adminClient();
  if (!supabase || !slug) {
    return {
      ok: false,
      email: normalized,
      slug,
      reason: "missing_supabase_or_slug",
    };
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("id, programs")
    .eq("email", normalized)
    .maybeSingle();

  let createdProfile = false;
  if (!profile) {
    const userId = await findAuthUserId(supabase, normalized);
    if (!userId) {
      return {
        ok: false,
        email: normalized,
        slug,
        reason: "no_auth_user_yet",
      };
    }
    const { data: upserted, error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email: normalized,
        programs: [slug],
        stripe_customer_id: stripeCustomerId || null,
        updated_at: new Date().toISOString(),
      })
      .select("id, programs")
      .maybeSingle();
    if (upsertError || !upserted) {
      return {
        ok: false,
        email: normalized,
        slug,
        reason: upsertError?.message || "profile_upsert_failed",
      };
    }
    return { ok: true, email: normalized, slug, createdProfile: true };
  }

  const current = Array.isArray(profile.programs)
    ? (profile.programs as string[])
    : [];
  const next = current.includes(slug) ? current : [...current, slug];
  const patch: Record<string, unknown> = {
    programs: next,
    updated_at: new Date().toISOString(),
  };
  if (stripeCustomerId) patch.stripe_customer_id = stripeCustomerId;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", profile.id);
  if (error) {
    return {
      ok: false,
      email: normalized,
      slug,
      reason: error.message,
    };
  }
  return { ok: true, email: normalized, slug, createdProfile };
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
  await supabase
    .from("profiles")
    .update({ programs: next, updated_at: new Date().toISOString() })
    .eq("id", profile.id);
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

  const grants: GrantResult[] = [];

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
      grants.push(await grantProgramByEmail(email, slug, customerId));
    } else {
      grants.push({
        ok: false,
        email: email || "",
        slug: slug || "",
        reason: "missing_email_slug_or_kind",
      });
    }
  }

  if (stripeEvent.type === "customer.subscription.updated") {
    const sub = stripeEvent.data.object as Stripe.Subscription;
    const slug = sub.metadata?.program;
    if (!slug) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ received: true, grants }),
      };
    }
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer) && customer.email) {
      const active =
        sub.status === "active" ||
        sub.status === "trialing" ||
        sub.status === "past_due";
      if (active) {
        grants.push(
          await grantProgramByEmail(customer.email, slug, customerId),
        );
      } else {
        await revokeProgramByEmail(customer.email, slug);
      }
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

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ received: true, type: stripeEvent.type, grants }),
  };
};
