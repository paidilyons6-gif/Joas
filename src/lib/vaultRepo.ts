import { getSupabase } from "./supabase";

export type VaultItem = {
  id: string;
  title: string;
  blurb: string;
  fileName: string;
  size: number;
  createdAt: string;
  url: string | null;
};

const ENDPOINT = "/.netlify/functions/vault";

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("The Vault needs the live site.");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in again to open the Vault.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function call<T>(init: RequestInit): Promise<T> {
  const res = await fetch(ENDPOINT, { ...init, headers: await authHeaders() });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error || `Vault error (${res.status})`);
  return body;
}

export function listVault() {
  return call<{ files: VaultItem[]; isAdmin: boolean }>({ method: "GET" });
}

function post(payload: Record<string, unknown>) {
  return call<{ ok?: boolean; path?: string; token?: string }>({
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadVaultFile(file: File, title: string, blurb: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("The Vault needs the live site.");
  const { path, token } = await post({ action: "upload-url", fileName: file.name });
  if (!path || !token) throw new Error("Couldn't start the upload.");
  const { error } = await supabase.storage
    .from("vault")
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type || "application/octet-stream",
    });
  if (error) throw new Error(error.message);
  await post({ action: "add", path, fileName: file.name, size: file.size, title, blurb });
}

export function updateVaultFile(id: string, title: string, blurb: string) {
  return post({ action: "update", id, title, blurb });
}

export function moveVaultFile(id: string, direction: "up" | "down") {
  return post({ action: "move", id, direction });
}

export function deleteVaultFile(id: string) {
  return post({ action: "delete", id });
}

export function formatFileSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileKind(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const kinds: Record<string, string> = {
    pdf: "PDF",
    key: "Keynote",
    ppt: "PowerPoint",
    pptx: "PowerPoint",
    doc: "Word",
    docx: "Word",
    xls: "Excel",
    xlsx: "Excel",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    mp4: "Video",
    mov: "Video",
  };
  return kinds[ext] || ext.toUpperCase() || "File";
}
