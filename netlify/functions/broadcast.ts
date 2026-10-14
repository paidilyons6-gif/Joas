import type { Handler } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import { mailConfigured, sendMail, transporter } from "./_mail";
import {
  buildAudiences,
  getAdminEmail,
  jobPath,
  listJobs,
  readJson,
  readUnsubscribes,
  renderBroadcast,
  serviceClient,
  writeJson,
  type BroadcastJob,
} from "./_broadcast";

/** Each call stays well under Netlify's 10s function limit; the page keeps calling "continue". */
const CHUNK_BUDGET_MS = 6500;
const LOCK_MS = 20000;
const PACE_MS = 250;

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}

function summary(job: BroadcastJob) {
  return {
    id: job.id,
    audienceLabel: job.audienceLabel,
    subject: job.subject,
    createdAt: job.createdAt,
    total: job.recipients.length,
    sent: job.sent,
    remaining: job.recipients.length - job.cursor,
    failures: job.failures,
    status: job.status,
    finishedAt: job.finishedAt,
  };
}

export const handler: Handler = async (event) => {
  const supabase = serviceClient();
  if (!supabase) return json(503, { error: "Supabase is not configured." });
  const adminEmail = await getAdminEmail(
    supabase,
    event.headers.authorization || event.headers.Authorization,
  );
  if (!adminEmail) return json(403, { error: "Only the coach can send emails." });

  if (event.httpMethod === "GET") {
    const [audiences, jobs, unsubscribed] = await Promise.all([
      buildAudiences(supabase),
      listJobs(supabase),
      readUnsubscribes(supabase),
    ]);
    return json(200, {
      mailReady: mailConfigured(),
      audiences: audiences.map((a) => ({
        id: a.id,
        label: a.label,
        count: a.recipients.length,
      })),
      jobs: jobs.map(summary),
      unsubscribed: unsubscribed.length,
    });
  }

  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!mailConfigured()) {
    return json(503, { error: "Email is not configured on Netlify (GMAIL_APP_PASSWORD)." });
  }

  let input: Record<string, unknown>;
  try {
    input = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }
  const subject = String(input.subject || "").trim();
  const body = String(input.body || "").trim();

  try {
    if (input.action === "test") {
      if (!subject || !body) return json(400, { error: "Add a subject and message first." });
      const mail = renderBroadcast(`[Test] ${subject}`, body, {
        email: adminEmail,
        name: "Becca",
      });
      await sendMail({ to: adminEmail, ...mail });
      return json(200, { ok: true, sentTo: adminEmail });
    }

    if (input.action === "start") {
      if (!subject || !body) return json(400, { error: "Add a subject and message first." });
      const audiences = await buildAudiences(supabase);
      const audience = audiences.find((a) => a.id === input.audience);
      if (!audience) return json(400, { error: "Pick who to send to." });
      if (!audience.recipients.length) return json(400, { error: "Nobody in that group yet." });
      const job: BroadcastJob = {
        id: `${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}-${randomUUID().slice(0, 6)}`,
        audienceId: audience.id,
        audienceLabel: audience.label,
        subject,
        body,
        createdAt: new Date().toISOString(),
        createdBy: adminEmail,
        recipients: audience.recipients,
        cursor: 0,
        sent: 0,
        failures: [],
        status: "sending",
        lockUntil: 0,
      };
      await writeJson(supabase, jobPath(job.id), job);
      return json(200, { job: summary(job) });
    }

    if (input.action === "continue") {
      const id = String(input.job || "");
      const job = await readJson<BroadcastJob | null>(supabase, jobPath(id), null);
      if (!job) return json(404, { error: "That send wasn't found." });
      if (job.status === "done") return json(200, { job: summary(job) });
      if (job.lockUntil > Date.now()) {
        return json(409, { error: "This send is already running in another window." });
      }
      job.lockUntil = Date.now() + LOCK_MS;
      await writeJson(supabase, jobPath(job.id), job);

      const blocked = new Set(await readUnsubscribes(supabase));
      const transport = transporter({ pool: true });
      const started = Date.now();
      try {
        while (job.cursor < job.recipients.length && Date.now() - started < CHUNK_BUDGET_MS) {
          const recipient = job.recipients[job.cursor];
          job.cursor += 1;
          if (blocked.has(recipient.email)) continue;
          try {
            const mail = renderBroadcast(job.subject, job.body, recipient);
            await sendMail({ to: recipient.email, ...mail, transport });
            job.sent += 1;
          } catch (err) {
            job.failures.push({
              email: recipient.email,
              error: err instanceof Error ? err.message.slice(0, 200) : "failed",
            });
          }
          await new Promise((r) => setTimeout(r, PACE_MS));
        }
      } finally {
        transport.close();
      }

      job.lockUntil = 0;
      if (job.cursor >= job.recipients.length) {
        job.status = "done";
        job.finishedAt = new Date().toISOString();
      }
      await writeJson(supabase, jobPath(job.id), job);
      return json(200, { job: summary(job) });
    }

    return json(400, { error: "Unknown action" });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Email error" });
  }
};
