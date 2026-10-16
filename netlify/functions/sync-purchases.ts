import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "r.lyons1@icloud.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const stripeSecret =
  process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function findAuthUserId(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.toLowerCase();
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
  supabase: SupabaseClient,
  email: string,
  slug: string,
  stripeCustomerId?: string | null,
) {
  const normalized = email.trim().toLowerCase();
  let { data: profile } = await supabase
    .from("profiles")
    .select("id, programs")
    .eq("email", normalized)
    .maybeSingle();

  if (!profile) {
    const userId = await findAuthUserId(supabase, normalized);
    if (!userId) {
      return { email: normalized, slug, ok: false, reason: "no_auth_user_yet" };
    }
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email: normalized,
      programs: [slug],
      stripe_customer_id: stripeCustomerId || null,
      updated_at: new Date().toISOString(),
    });
    return {
      email: normalized,
      slug,
      ok: !error,
      reason: error?.message,
      createdProfile: true,
    };
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
  return {
    email: normalized,
    slug,
    ok: !error,
    reason: error?.message,
    alreadyHad: current.includes(slug),
  };
}

/** Admin: backfill program entitlements from paid Stripe Checkout sessions. */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const secret = process.env.STUDIO_PRICE_SECRET;
  if (!secret) {
    return { statusCode: 503, body: "Set STUDIO_PRICE_SECRET on Netlify." };
  }
  if (!stripeSecret) {
    return { statusCode: 503, body: "Stripe is not configured." };
  }

  let email = "";
  let provided = "";
  let limit = 100;
  try {
    const body = JSON.parse(event.body || "{}") as {
      email?: string;
      secret?: string;
      limit?: number;
    };
    email = (body.email || "").trim().toLowerCase();
    provided = body.secret || "";
    if (body.limit && body.limit > 0) limit = Math.min(body.limit, 100);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!ADMIN_EMAILS.includes(email) || provided !== secret) {
    return { statusCode: 403, body: "Not authorized" };
  }

  const supabase = adminClient();
  if (!supabase) {
    return { statusCode: 503, body: "Supabase is not configured." };
  }

  const stripe = new Stripe(stripeSecret);
  const sessions = await stripe.checkout.sessions.list({
    limit,
    status: "complete",
  });

  const results: unknown[] = [];
  for (const session of sessions.data) {
    if (session.payment_status !== "paid") continue;
    if (session.metadata?.kind !== "program") continue;
    const slug = session.metadata?.productId || session.metadata?.program;
    const buyer =
      session.customer_details?.email || session.customer_email || "";
    if (!slug || !buyer) continue;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    const grant = await grantProgramByEmail(
      supabase,
      buyer,
      slug,
      customerId,
    );
    results.push({
      sessionId: session.id,
      ...grant,
    });
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      scanned: sessions.data.length,
      grants: results,
    }),
  };
};
