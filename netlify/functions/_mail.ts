import nodemailer from "nodemailer";

const fromAddress =
  process.env.MAIL_FROM ||
  process.env.GMAIL_USER ||
  "paidilyons6@gmail.com";
const smtpUser =
  process.env.MAIL_USER ||
  process.env.GMAIL_USER ||
  fromAddress;
const smtpPass =
  process.env.MAIL_PASS ||
  process.env.GMAIL_APP_PASSWORD ||
  process.env.SMTP_PASS ||
  "";

export function mailConfigured() {
  return Boolean(smtpUser && smtpPass);
}

export function getMailFrom() {
  const name =
    process.env.MAIL_FROM_NAME || "The Office · BusinessByBecca";
  return `"${name}" <${fromAddress}>`;
}

function transporter() {
  if (!mailConfigured()) {
    throw new Error(
      "Email is not configured. Set GMAIL_APP_PASSWORD (or MAIL_PASS) on Netlify for paidilyons6@gmail.com.",
    );
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendMail(input: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  bcc?: string | string[];
  replyTo?: string;
}) {
  const transport = transporter();
  const info = await transport.sendMail({
    from: getMailFrom(),
    to: input.to,
    bcc: input.bcc,
    replyTo: input.replyTo || fromAddress,
    subject: input.subject,
    text: input.text,
    html: input.html || input.text.replace(/\n/g, "<br/>"),
  });
  return info;
}

export function waitlistWelcomeEmail(subscriberEmail: string) {
  const subject = "You’re on the list — The Office opens soon ♡";
  const text = [
    "Hey,",
    "",
    "You’re on the waitlist for The Office by BusinessByBecca.",
    "We’ll email you here as soon as programs go live.",
    "",
    "— Becca & the team",
    "",
    `(This email was sent to ${subscriberEmail}.)`,
  ].join("\n");
  return { subject, text };
}

export function waitlistAdminNotifyEmail(subscriberEmail: string) {
  const subject = `New waitlist signup: ${subscriberEmail}`;
  const text = [
    "New waitlist signup for BusinessByBecca / The Office:",
    "",
    subscriberEmail,
    "",
    "View / export in Studio → Launch waitlist.",
  ].join("\n");
  return { subject, text };
}

export function launchAnnounceEmail() {
  const site =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://businessbybecca.netlify.app";
  const subject = "The Office is open — you’re invited ♡";
  const text = [
    "Hey,",
    "",
    "The Office is live.",
    "Create your free account, pick a program, and come train with us.",
    "",
    site,
    "",
    "— Becca",
    "BusinessByBecca · The Office",
  ].join("\n");
  const html = `
    <div style="font-family:Georgia,serif;line-height:1.5;color:#1a1a1a">
      <p>Hey,</p>
      <p><strong>The Office is live.</strong><br/>
      Create your free account, pick a program, and come train with us.</p>
      <p><a href="${site}" style="color:#ff2d8b;font-weight:700">${site}</a></p>
      <p>— Becca<br/><span style="color:#4a4a4a">BusinessByBecca · The Office</span></p>
    </div>
  `;
  return { subject, text, html };
}
