import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "r.lyons1@icloud.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const BUCKET = "ops";
const UNSUBSCRIBES_PATH = "unsubscribes.json";

export const SITE_URL =
  process.env.URL || "https://businessbybecca.netlify.app";

export type Recipient = { email: string; name: string };

export type Audience = { id: string; label: string; recipients: Recipient[] };

export type BroadcastJob = {
  id: string;
  audienceId: string;
  audienceLabel: string;
  subject: string;
  body: string;
  createdAt: string;
  createdBy: string;
  recipients: Recipient[];
  cursor: number;
  sent: number;
  failures: { email: string; error: string }[];
  status: "sending" | "done";
  lockUntil: number;
  finishedAt?: string;
};

export function serviceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getAdminEmail(
  supabase: SupabaseClient,
  authHeader: string | undefined,
): Promise<string | null> {
  const token = (authHeader || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;
  const email = data.user.email.toLowerCase();
  if (ADMIN_EMAILS.includes(email)) return email;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  return profile?.is_admin === true ? email : null;
}

async function ensureBucket(supabase: SupabaseClient) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) await supabase.storage.createBucket(BUCKET, { public: false });
}

/** Storage's CDN can serve an old copy of a just-overwritten object; a unique query string skips it. */
export async function readFreshObject(bucket: string, path: string): Promise<string | null> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(
    `${url}/storage/v1/object/authenticated/${bucket}/${path}?fresh=${Date.now()}-${Math.random().toString(36).slice(2)}`,
    {
      headers: { Authorization: `Bearer ${key}`, apikey: key, "Cache-Control": "no-cache" },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  return res.text();
}

export async function readJson<T>(
  supabase: SupabaseClient,
  path: string,
  fallback: T,
): Promise<T> {
  await ensureBucket(supabase);
  const text = await readFreshObject(BUCKET, path);
  if (text === null) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(
  supabase: SupabaseClient,
  path: string,
  value: unknown,
) {
  await ensureBucket(supabase);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, JSON.stringify(value), {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

export const jobPath = (id: string) => `broadcasts/${id}.json`;

export async function listJobs(supabase: SupabaseClient): Promise<BroadcastJob[]> {
  await ensureBucket(supabase);
  const { data } = await supabase.storage.from(BUCKET).list("broadcasts", {
    limit: 10,
    sortBy: { column: "created_at", order: "desc" },
  });
  const jobs = await Promise.all(
    (data || [])
      .filter((o) => o.name.endsWith(".json"))
      .map((o) =>
        readJson<BroadcastJob | null>(supabase, `broadcasts/${o.name}`, null),
      ),
  );
  return jobs.filter((j): j is BroadcastJob => !!j);
}

export async function readUnsubscribes(supabase: SupabaseClient): Promise<string[]> {
  return readJson<string[]>(supabase, UNSUBSCRIBES_PATH, []);
}

export async function addUnsubscribe(supabase: SupabaseClient, email: string) {
  const list = await readUnsubscribes(supabase);
  const normalized = email.trim().toLowerCase();
  if (list.includes(normalized)) return;
  await writeJson(supabase, UNSUBSCRIBES_PATH, [...list, normalized]);
}

function signingKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function unsubscribeToken(email: string) {
  return createHmac("sha256", signingKey())
    .update(`unsubscribe:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string) {
  const expected = Buffer.from(unsubscribeToken(email));
  const given = Buffer.from(token || "");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(email: string) {
  const params = new URLSearchParams({
    e: email.trim().toLowerCase(),
    t: unsubscribeToken(email),
  });
  return `${SITE_URL}/.netlify/functions/unsubscribe?${params}`;
}

function firstName(fullName: string | null | undefined) {
  const first = (fullName || "").trim().split(/\s+/)[0] || "";
  if (!first || first.includes("@")) return "";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function isTestAddress(email: string) {
  return email.endsWith("@example.com");
}

function prettySlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Everyone (accounts + waitlist), each program (buyers + comped grants), and free accounts. */
export async function buildAudiences(supabase: SupabaseClient): Promise<Audience[]> {
  const [profilesRes, waitlistRes, grantsRes, tracksRes, unsubscribed] =
    await Promise.all([
      supabase.from("profiles").select("email, full_name, programs"),
      supabase.from("waitlist_emails").select("email"),
      supabase.from("program_grants").select("email, slug"),
      supabase.from("course_tracks").select("id, title"),
      readUnsubscribes(supabase),
    ]);
  if (profilesRes.error) throw new Error(profilesRes.error.message);

  const blocked = new Set(unsubscribed);
  const people = new Map<string, Recipient>();
  const add = (map: Map<string, Recipient>, email: string, name = "") => {
    const normalized = (email || "").trim().toLowerCase();
    if (!normalized || isTestAddress(normalized) || blocked.has(normalized)) return;
    const existing = map.get(normalized);
    if (!existing || (!existing.name && name)) map.set(normalized, { email: normalized, name });
  };

  const profiles = profilesRes.data || [];
  const names = new Map<string, string>();
  for (const p of profiles) {
    const name = firstName(p.full_name as string);
    names.set(String(p.email || "").toLowerCase(), name);
    add(people, String(p.email || ""), name);
  }
  for (const w of waitlistRes.data || []) add(people, String(w.email || ""));

  const bySlug = new Map<string, Map<string, Recipient>>();
  const slugMap = (slug: string) => {
    if (!bySlug.has(slug)) bySlug.set(slug, new Map());
    return bySlug.get(slug)!;
  };
  for (const p of profiles) {
    for (const slug of (p.programs as string[] | null) || []) {
      add(slugMap(slug), String(p.email || ""), firstName(p.full_name as string));
    }
  }
  for (const g of grantsRes.data || []) {
    const email = String(g.email || "").toLowerCase();
    add(slugMap(String(g.slug)), email, names.get(email) || "");
  }

  const free = new Map<string, Recipient>();
  for (const p of profiles) {
    if (!((p.programs as string[] | null) || []).length) {
      add(free, String(p.email || ""), firstName(p.full_name as string));
    }
  }
  for (const map of bySlug.values()) for (const email of map.keys()) free.delete(email);

  const titles = new Map(
    (tracksRes.data || []).map((t) => [String(t.id), String(t.title)]),
  );
  const programAudiences: Audience[] = [...bySlug.entries()]
    .filter(([slug]) => slug !== "full-access")
    .map(([slug, map]) => ({
      id: `program:${slug}`,
      label:
        slug === "seen-heard-earn"
          ? `${titles.get(slug) || "Seen. Heard. Earn."} (3-day workshop)`
          : titles.get(slug) || prettySlug(slug),
      recipients: [...map.values()],
    }));

  return [
    { id: "everyone", label: "Everyone (all accounts + waitlist)", recipients: [...people.values()] },
    ...programAudiences,
    { id: "free", label: "Signed up, no program yet", recipients: [...free.values()] },
  ];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function personalize(template: string, recipient: Recipient) {
  return template.replace(/\{name\}/gi, recipient.name || "there");
}

export function renderBroadcast(
  subject: string,
  body: string,
  recipient: Recipient,
) {
  const unsubscribe = unsubscribeUrl(recipient.email);
  const personalSubject = personalize(subject, recipient);
  const personalBody = personalize(body, recipient);
  const text = [
    personalBody,
    "",
    "—",
    "BusinessByBecca · The Office",
    `Unsubscribe: ${unsubscribe}`,
  ].join("\n");
  const htmlBody = escapeHtml(personalBody)
    .replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" style="color:#ff2d8b;font-weight:700">$1</a>',
    )
    .replace(/\n/g, "<br/>");
  const html = `
    <div style="font-family:Georgia,serif;line-height:1.55;color:#1a1a1a;max-width:560px">
      <p>${htmlBody}</p>
      <p style="margin-top:2rem;font-size:12px;color:#777">
        BusinessByBecca · The Office<br/>
        You're getting this because you signed up at businessbybecca.
        <a href="${unsubscribe}" style="color:#777">Unsubscribe</a>
      </p>
    </div>
  `;
  return {
    subject: personalSubject,
    text,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribe}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
