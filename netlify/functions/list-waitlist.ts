import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "r.lyons1@icloud.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const secret = process.env.STUDIO_PRICE_SECRET;
  if (!secret) {
    return {
      statusCode: 503,
      body: "Set STUDIO_PRICE_SECRET on Netlify to export the waitlist.",
    };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 503, body: "Supabase is not configured." };
  }

  let email = "";
  let provided = "";
  try {
    const body = JSON.parse(event.body || "{}") as {
      email?: string;
      secret?: string;
    };
    email = (body.email || "").trim().toLowerCase();
    provided = body.secret || "";
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!ADMIN_EMAILS.includes(email) || provided !== secret) {
    return { statusCode: 403, body: "Not authorized" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("waitlist_emails")
    .select("email, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { statusCode: 500, body: error.message };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emails: data || [] }),
  };
};
