import type { Handler } from "@netlify/functions";
import {
  addUnsubscribe,
  serviceClient,
  SITE_URL,
  verifyUnsubscribeToken,
} from "./_broadcast";

function page(title: string, message: string) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:Georgia,serif;background:#faf7f5;color:#1a1a1a;display:grid;place-items:center;min-height:100vh;margin:0">
<div style="max-width:420px;padding:2rem;text-align:center">
<h1 style="font-size:1.6rem">${title}</h1><p>${message}</p>
<p><a href="${SITE_URL}" style="color:#ff2d8b;font-weight:700">BusinessByBecca</a></p></div></body></html>`,
  };
}

/** One-click unsubscribe from Becca's broadcast emails (signed link, no login). */
export const handler: Handler = async (event) => {
  const params = event.queryStringParameters || {};
  const email = String(params.e || "").trim().toLowerCase();
  const token = String(params.t || "");
  if (!email || !verifyUnsubscribeToken(email, token)) {
    return page("Link not valid", "This unsubscribe link doesn't look right. Reply to any email and we'll take you off the list.");
  }
  const supabase = serviceClient();
  if (!supabase) return page("Try again later", "Something went wrong on our side.");
  await addUnsubscribe(supabase, email);
  return page(
    "You're unsubscribed",
    `${email} won't get any more announcement emails from Becca. Your account and programs aren't affected.`,
  );
};
