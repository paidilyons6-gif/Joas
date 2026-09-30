import { getSupabase } from "./supabase";
import { hasLiveBackend } from "./demo";

export type VillagePost = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  pinned: boolean;
};

const LOCAL_KEY = "bbb_village_posts_v1";

function normalizePost(raw: Partial<VillagePost> & { id: string }): VillagePost {
  return {
    id: raw.id,
    authorId: raw.authorId || "",
    authorName: raw.authorName || "Member",
    body: raw.body || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    pinned: !!raw.pinned,
  };
}

function sortPosts(posts: VillagePost[]) {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function readLocal(): VillagePost[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as Partial<VillagePost>[];
    return raw.map((p) => normalizePost({ ...p, id: p.id || crypto.randomUUID() }));
  } catch {
    return [];
  }
}

function writeLocal(posts: VillagePost[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(posts.slice(0, 200)));
}

export async function listVillagePosts(): Promise<VillagePost[]> {
  if (!hasLiveBackend()) {
    return sortPosts(readLocal());
  }
  const supabase = getSupabase();
  if (!supabase) return sortPosts(readLocal());

  const { data, error } = await supabase
    .from("village_posts")
    .select("id, author_id, author_name, body, created_at, pinned")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    // Column may not exist yet — retry without pinned
    const fallback = await supabase
      .from("village_posts")
      .select("id, author_id, author_name, body, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (fallback.error || !fallback.data) return sortPosts(readLocal());
    return sortPosts(
      fallback.data.map((p) =>
        normalizePost({
          id: p.id as string,
          authorId: p.author_id as string,
          authorName: p.author_name as string,
          body: p.body as string,
          createdAt: p.created_at as string,
          pinned: false,
        }),
      ),
    );
  }
  return sortPosts(
    data.map((p) =>
      normalizePost({
        id: p.id as string,
        authorId: p.author_id as string,
        authorName: p.author_name as string,
        body: p.body as string,
        createdAt: p.created_at as string,
        pinned: !!(p as { pinned?: boolean }).pinned,
      }),
    ),
  );
}

export async function createVillagePost(input: {
  authorId: string;
  authorName: string;
  body: string;
}): Promise<VillagePost> {
  const body = input.body.trim();
  if (!body) throw new Error("Write something first");

  if (!hasLiveBackend()) {
    const post = normalizePost({
      id: crypto.randomUUID(),
      authorId: input.authorId,
      authorName: input.authorName,
      body,
      createdAt: new Date().toISOString(),
      pinned: false,
    });
    writeLocal([post, ...readLocal()]);
    return post;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("village_posts")
    .insert({
      author_id: input.authorId,
      author_name: input.authorName,
      body,
    })
    .select("id, author_id, author_name, body, created_at, pinned")
    .single();
  if (error || !data) {
    // Retry without pinned column for older schemas
    const retry = await supabase
      .from("village_posts")
      .insert({
        author_id: input.authorId,
        author_name: input.authorName,
        body,
      })
      .select("id, author_id, author_name, body, created_at")
      .single();
    if (retry.error || !retry.data) {
      throw new Error(error?.message || retry.error?.message || "Could not post");
    }
    return normalizePost({
      id: retry.data.id as string,
      authorId: retry.data.author_id as string,
      authorName: retry.data.author_name as string,
      body: retry.data.body as string,
      createdAt: retry.data.created_at as string,
      pinned: false,
    });
  }
  return normalizePost({
    id: data.id as string,
    authorId: data.author_id as string,
    authorName: data.author_name as string,
    body: data.body as string,
    createdAt: data.created_at as string,
    pinned: !!(data as { pinned?: boolean }).pinned,
  });
}

export async function setVillagePostPinned(id: string, pinned: boolean) {
  if (!hasLiveBackend()) {
    writeLocal(
      readLocal().map((p) => (p.id === id ? { ...p, pinned } : p)),
    );
    return;
  }
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("village_posts")
    .update({ pinned })
    .eq("id", id);
  if (error) {
    // Keep local mirror so coach can still pin in demo/offline
    writeLocal(
      (await listVillagePosts()).map((p) =>
        p.id === id ? { ...p, pinned } : p,
      ),
    );
    throw new Error(
      error.message.includes("pinned")
        ? "Run migration 011_coach_ops.sql to enable pin posts."
        : error.message,
    );
  }
}

export async function deleteVillagePost(id: string) {
  if (!hasLiveBackend()) {
    writeLocal(readLocal().filter((p) => p.id !== id));
    return;
  }
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("village_posts").delete().eq("id", id);
}
