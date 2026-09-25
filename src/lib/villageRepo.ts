import { getSupabase } from "./supabase";
import { hasLiveBackend } from "./demo";

export type VillagePost = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

const LOCAL_KEY = "bbb_village_posts_v1";

function readLocal(): VillagePost[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as VillagePost[];
  } catch {
    return [];
  }
}

function writeLocal(posts: VillagePost[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(posts.slice(0, 200)));
}

export async function listVillagePosts(): Promise<VillagePost[]> {
  if (!hasLiveBackend()) {
    return readLocal().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const supabase = getSupabase();
  if (!supabase) return readLocal();

  const { data, error } = await supabase
    .from("village_posts")
    .select("id, author_id, author_name, body, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return readLocal();
  return data.map((p) => ({
    id: p.id as string,
    authorId: p.author_id as string,
    authorName: p.author_name as string,
    body: p.body as string,
    createdAt: p.created_at as string,
  }));
}

export async function createVillagePost(input: {
  authorId: string;
  authorName: string;
  body: string;
}): Promise<VillagePost> {
  const body = input.body.trim();
  if (!body) throw new Error("Write something first");

  if (!hasLiveBackend()) {
    const post: VillagePost = {
      id: crypto.randomUUID(),
      authorId: input.authorId,
      authorName: input.authorName,
      body,
      createdAt: new Date().toISOString(),
    };
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
    .select("id, author_id, author_name, body, created_at")
    .single();
  if (error || !data) throw new Error(error?.message || "Could not post");
  return {
    id: data.id as string,
    authorId: data.author_id as string,
    authorName: data.author_name as string,
    body: data.body as string,
    createdAt: data.created_at as string,
  };
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
