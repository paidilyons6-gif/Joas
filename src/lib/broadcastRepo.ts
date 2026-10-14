import { authJsonHeaders } from "./supabase";

export type BroadcastAudience = { id: string; label: string; count: number };

export type BroadcastJobSummary = {
  id: string;
  audienceLabel: string;
  subject: string;
  createdAt: string;
  total: number;
  cursor: number;
  sent: number;
  remaining: number;
  failures: { email: string; error: string }[];
  status: "sending" | "done";
  finishedAt?: string;
};

export type BroadcastOverview = {
  mailReady: boolean;
  audiences: BroadcastAudience[];
  jobs: BroadcastJobSummary[];
  unsubscribed: number;
};

const ENDPOINT = "/.netlify/functions/broadcast";

async function call<T>(init: RequestInit): Promise<T> {
  const res = await fetch(ENDPOINT, { ...init, headers: await authJsonHeaders() });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error || `Email error (${res.status})`);
  return body;
}

export function fetchBroadcastOverview() {
  return call<BroadcastOverview>({ method: "GET" });
}

function post<T>(payload: Record<string, unknown>) {
  return call<T>({ method: "POST", body: JSON.stringify(payload) });
}

export function sendBroadcastTest(subject: string, body: string) {
  return post<{ sentTo: string }>({ action: "test", subject, body });
}

export async function startBroadcast(audience: string, subject: string, body: string) {
  const { job } = await post<{ job: BroadcastJobSummary }>({
    action: "start",
    audience,
    subject,
    body,
  });
  return job;
}

/** Sends batch after batch until the job is finished, reporting progress after each one. */
export async function runBroadcast(
  start: BroadcastJobSummary,
  onProgress: (job: BroadcastJobSummary) => void,
) {
  let from = start.cursor;
  let retries = 0;
  for (;;) {
    let job: BroadcastJobSummary;
    try {
      ({ job } = await post<{ job: BroadcastJobSummary }>({
        action: "continue",
        job: start.id,
        from,
      }));
      retries = 0;
    } catch (err) {
      // A batch can be cut off by Netlify's time limit; progress is saved per email, so just try again.
      if (++retries > 4) throw err;
      await new Promise((r) => setTimeout(r, 6000));
      continue;
    }
    from = Math.max(from, job.cursor);
    onProgress(job);
    if (job.status === "done") return job;
  }
}
