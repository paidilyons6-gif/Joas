import type { Handler } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFreshObject } from "./_broadcast";

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "r.lyons1@icloud.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const BUCKET = "vault";
const INDEX_PATH = "_index.json";
const DOWNLOAD_TTL_SECONDS = 60 * 60;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export type VaultFile = {
  id: string;
  title: string;
  blurb: string;
  path: string;
  fileName: string;
  size: number;
  createdAt: string;
};

type Viewer = { isAdmin: boolean; isMember: boolean };

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function ensureBucket(supabase: SupabaseClient) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_FILE_BYTES,
  });
}

async function readIndex(): Promise<VaultFile[]> {
  const text = await readFreshObject(BUCKET, INDEX_PATH);
  if (text === null) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as VaultFile[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(supabase: SupabaseClient, files: VaultFile[]) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(INDEX_PATH, JSON.stringify(files, null, 2), {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

async function getViewer(
  supabase: SupabaseClient,
  authHeader: string | undefined,
): Promise<Viewer | null> {
  const token = (authHeader || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const email = (data.user.email || "").toLowerCase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("programs, is_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  const isAdmin = ADMIN_EMAILS.includes(email) || profile?.is_admin === true;
  const programs = (profile?.programs as string[] | null) || [];
  return { isAdmin, isMember: isAdmin || programs.length > 0 };
}

function safeName(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[^\w.\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 120) || "file"
  );
}

/** Vault files: buyers list and download, admins upload, edit, reorder and delete. */
export const handler: Handler = async (event) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json(503, { error: "Supabase is not configured." });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const viewer = await getViewer(
    supabase,
    event.headers.authorization || event.headers.Authorization,
  );
  if (!viewer) return json(401, { error: "Sign in to open the Vault." });

  await ensureBucket(supabase);

  if (event.httpMethod === "GET") {
    const files = await readIndex();
    if (!viewer.isMember) {
      return json(200, {
        files: files.map((f) => ({ ...f, path: "", url: null })),
        isAdmin: false,
      });
    }
    const withUrls = await Promise.all(
      files.map(async (f) => {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(f.path, DOWNLOAD_TTL_SECONDS, { download: f.fileName });
        return { ...f, url: data?.signedUrl || null };
      }),
    );
    return json(200, { files: withUrls, isAdmin: viewer.isAdmin });
  }

  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!viewer.isAdmin) return json(403, { error: "Only the coach can change the Vault." });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  try {
    const files = await readIndex();

    switch (body.action) {
      case "upload-url": {
        const fileName = safeName(String(body.fileName || ""));
        const path = `files/${randomUUID()}-${fileName}`;
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUploadUrl(path);
        if (error || !data) return json(500, { error: error?.message || "Upload failed" });
        return json(200, { path, token: data.token });
      }
      case "add": {
        const path = String(body.path || "");
        if (!path.startsWith("files/")) return json(400, { error: "Missing file" });
        const entry: VaultFile = {
          id: randomUUID(),
          title: String(body.title || "").trim() || String(body.fileName || "File"),
          blurb: String(body.blurb || "").trim(),
          path,
          fileName: String(body.fileName || path.split("/").pop()),
          size: Number(body.size) || 0,
          createdAt: new Date().toISOString(),
        };
        await writeIndex(supabase, [...files, entry]);
        return json(200, { ok: true, file: entry });
      }
      case "update": {
        const next = files.map((f) =>
          f.id === body.id
            ? {
                ...f,
                title: String(body.title ?? f.title).trim() || f.title,
                blurb: String(body.blurb ?? f.blurb).trim(),
              }
            : f,
        );
        await writeIndex(supabase, next);
        return json(200, { ok: true });
      }
      case "move": {
        const index = files.findIndex((f) => f.id === body.id);
        const target = index + (body.direction === "up" ? -1 : 1);
        if (index < 0 || target < 0 || target >= files.length) return json(200, { ok: true });
        const next = [...files];
        [next[index], next[target]] = [next[target], next[index]];
        await writeIndex(supabase, next);
        return json(200, { ok: true });
      }
      case "delete": {
        const hit = files.find((f) => f.id === body.id);
        if (!hit) return json(200, { ok: true });
        await supabase.storage.from(BUCKET).remove([hit.path]);
        await writeIndex(
          supabase,
          files.filter((f) => f.id !== body.id),
        );
        return json(200, { ok: true });
      }
      default:
        return json(400, { error: "Unknown action" });
    }
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Vault error" });
  }
};
