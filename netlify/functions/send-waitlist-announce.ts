import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { launchAnnounceEmail, mailConfigured, sendMail } from "./_mail";

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
    return { statusCode: 503, body: "Set STUDIO_PRICE_SECRET on Netlify." };
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 503, body: "Supabase is not configured." };
  }
  if (!mailConfigured()) {
    return {
      statusCode: 503,
      body: "Email is not configured. Set GMAIL_APP_PASSWORD on Netlify for paidilyons6@gmail.com.",
    };
  }

  let email = "";
  let provided = "";
  let customSubject = "";
  let customBody = "";
  try {
    const body = JSON.parse(event.body || "{}") as {
      email?: string;
      secret?: string;
      subject?: string;
      body?: string;
    };
    email = (body.email || "").trim().toLowerCase();
    provided = body.secret || "";
    customSubject = (body.subject || "").trim();
    customBody = (body.body || "").trim();
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!ADMIN_EMAILS.includes(email) || provided !== secret) {
    return { statusCode: 403, body: "Not authorized" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("waitlist_emails")
    .select("email")
    .order("created_at", { ascending: true });

  if (error) {
    return { statusCode: 500, body: error.message };
  }

  const recipients = (data || [])
    .map((r) => String(r.email || "").trim().toLowerCase())
    .filter(Boolean);

  if (!recipients.length) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, sent: 0, message: "No emails on the list." }),
    };
  }

  const fallback = launchAnnounceEmail();
  const subject = customSubject || fallback.subject;
  const text = customBody || fallback.text;
  const html = customBody
    ? customBody.replace(/\n/g, "<br/>")
    : fallback.html;

  let sent = 0;
  const failures: string[] = [];

  // Send one-by-one so Gmail rate limits don't drop the whole blast
  for (const to of recipients) {
    try {
      await sendMail({ to, subject, text, html });
      sent += 1;
      // gentle pacing for Gmail
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      failures.push(
        `${to}: ${err instanceof Error ? err.message : "failed"}`,
      );
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      sent,
      total: recipients.length,
      failures: failures.slice(0, 10),
    }),
  };
};
