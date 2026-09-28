import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import {
  mailConfigured,
  sendMail,
  waitlistAdminNotifyEmail,
  waitlistWelcomeEmail,
} from "./_mail";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const notifyTo =
  process.env.MAIL_NOTIFY_TO ||
  process.env.MAIL_FROM ||
  process.env.GMAIL_USER ||
  "paidilyons6@gmail.com";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 503,
      body: "Waitlist storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  let email = "";
  let source = "gate";
  try {
    const body = JSON.parse(event.body || "{}") as {
      email?: string;
      source?: string;
    };
    email = normalizeEmail(body.email || "");
    if (body.source?.trim()) source = body.source.trim().slice(0, 64);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!isValidEmail(email)) {
    return { statusCode: 400, body: "Enter a valid email address." };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { error } = await supabase
    .from("waitlist_emails")
    .insert({ email, source });

  let already = false;
  if (error) {
    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      already = true;
    } else {
      return {
        statusCode: 500,
        body: error.message || "Could not save email",
      };
    }
  }

  // Send from paidilyons6@gmail.com (Gmail SMTP) — welcome + admin ping
  let mailed = false;
  let mailError = "";
  if (mailConfigured() && !already) {
    try {
      const welcome = waitlistWelcomeEmail(email);
      await sendMail({
        to: email,
        subject: welcome.subject,
        text: welcome.text,
      });
      const notify = waitlistAdminNotifyEmail(email);
      await sendMail({
        to: notifyTo,
        subject: notify.subject,
        text: notify.text,
      });
      mailed = true;
    } catch (err) {
      mailError = err instanceof Error ? err.message : "Mail failed";
      console.error("waitlist mail error", mailError);
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      already,
      mailed,
      mailConfigured: mailConfigured(),
      ...(mailError ? { mailWarning: mailError } : {}),
    }),
  };
};
