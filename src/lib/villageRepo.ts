import { getSupabase } from "./supabase";
import { hasLiveBackend } from "./demo";
import { shrinkPhoto } from "./imageResize";
import { resolveLessonVideo } from "./videoEmbed";

export type VillageChannel = "office" | "ask";

export type VillagePost = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  pinned: boolean;
  /** Storage paths in the office-photos bucket */
  images: string[];
  /** Signed (or local data) URLs, same order as images */
  imageUrls: string[];
  /** Bunny (or other) video link — played inline */
  videoUrl: string;
  channel: VillageChannel;
  /** Parent question id when this is a reply on Ask Becca */
  replyTo: string | null;
};

export type AskThread = {
  question: VillagePost;
  replies: VillagePost[];
};

export const MAX_POST_PHOTOS = 4;
const PHOTO_BUCKET = "office-photos";
const PHOTO_URL_TTL_SECONDS = 60 * 60 * 6;
const LOCAL_KEY = "bbb_village_posts_v2";
const MEDIA_SQL_HINT =
  "Photos and videos need a quick database update: run supabase/migrations/016_office_photos.sql in Supabase.";
export const ASK_SQL_HINT =
  "Ask Becca needs a quick database update: run supabase/migrations/017_ask_becca.sql in Supabase.";

function normalizePost(raw: Partial<VillagePost> & { id: string }): VillagePost {
  return {
    id: raw.id,
    authorId: raw.authorId || "",
    authorName: raw.authorName || "Member",
    body: raw.body || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    pinned: !!raw.pinned,
    images: raw.images || [],
    imageUrls: raw.imageUrls || raw.images || [],
    videoUrl: raw.videoUrl || "",
    channel: raw.channel === "ask" ? "ask" : "office",
    replyTo: raw.replyTo || null,
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
  localStorage.setItem(LOCAL_KEY, JSON.stringify(posts.slice(0, 300)));
}

type DbPost = {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
  pinned?: boolean;
  images?: string[] | null;
  video_url?: string | null;
  channel?: string | null;
  reply_to?: string | null;
};

function fromDb(p: DbPost): VillagePost {
  return normalizePost({
    id: p.id,
    authorId: p.author_id,
    authorName: p.author_name,
    body: p.body,
    createdAt: p.created_at,
    pinned: !!p.pinned,
    images: p.images || [],
    imageUrls: [],
    videoUrl: p.video_url || "",
    channel: p.channel === "ask" ? "ask" : "office",
    replyTo: p.reply_to || null,
  });
}

async function attachPhotoUrls(posts: VillagePost[]): Promise<VillagePost[]> {
  const supabase = getSupabase();
  const paths = posts.flatMap((p) => p.images);
  if (!supabase || !paths.length) return posts;
  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, PHOTO_URL_TTL_SECONDS);
  const urls = new Map(
    (data || [])
      .filter((d) => d.signedUrl && d.path)
      .map((d) => [d.path as string, d.signedUrl]),
  );
  return posts.map((p) => ({
    ...p,
    imageUrls: p.images.map((path) => urls.get(path) || ""),
  }));
}

const COLUMN_SETS = [
  "id, author_id, author_name, body, created_at, pinned, images, video_url, channel, reply_to",
  "id, author_id, author_name, body, created_at, pinned, images, video_url",
  "id, author_id, author_name, body, created_at, pinned, images",
  "id, author_id, author_name, body, created_at, pinned",
  "id, author_id, author_name, body, created_at",
];

function filterChannel(posts: VillagePost[], channel: VillageChannel) {
  return posts.filter((p) => p.channel === channel && !p.replyTo);
}

export async function listVillagePosts(
  channel: VillageChannel = "office",
): Promise<VillagePost[]> {
  if (!hasLiveBackend()) {
    return sortPosts(filterChannel(readLocal(), channel));
  }
  const supabase = getSupabase();
  if (!supabase) return sortPosts(filterChannel(readLocal(), channel));

  for (const columns of COLUMN_SETS) {
    let query = supabase.from("village_posts").select(columns);
    if (columns.includes("channel")) {
      query = query.eq("channel", channel);
      if (columns.includes("reply_to")) query = query.is("reply_to", null);
    } else if (channel === "ask") {
      // Ask Becca needs the channel column — skip until migration 017 runs
      continue;
    }
    if (columns.includes("pinned")) query = query.order("pinned", { ascending: false });
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) {
      return sortPosts(
        await attachPhotoUrls((data as unknown as DbPost[]).map(fromDb)),
      );
    }
  }
  if (channel === "ask") return [];
  return sortPosts(filterChannel(readLocal(), channel));
}

export async function listAskThreads(): Promise<AskThread[]> {
  if (!hasLiveBackend()) {
    const all = readLocal().filter((p) => p.channel === "ask");
    return nestThreads(all);
  }
  const supabase = getSupabase();
  if (!supabase) {
    return nestThreads(readLocal().filter((p) => p.channel === "ask"));
  }

  for (const columns of COLUMN_SETS) {
    if (!columns.includes("channel") || !columns.includes("reply_to")) continue;
    const { data, error } = await supabase
      .from("village_posts")
      .select(columns)
      .eq("channel", "ask")
      .order("created_at", { ascending: true })
      .limit(300);
    if (!error && data) {
      const posts = await attachPhotoUrls((data as unknown as DbPost[]).map(fromDb));
      return nestThreads(posts);
    }
    if (/channel|reply_to/i.test(error?.message || "")) {
      throw new Error(ASK_SQL_HINT);
    }
  }
  throw new Error(ASK_SQL_HINT);
}

function nestThreads(posts: VillagePost[]): AskThread[] {
  const questions = sortPosts(posts.filter((p) => !p.replyTo));
  const byParent = new Map<string, VillagePost[]>();
  for (const p of posts) {
    if (!p.replyTo) continue;
    const list = byParent.get(p.replyTo) || [];
    list.push(p);
    byParent.set(p.replyTo, list);
  }
  return questions.map((question) => ({
    question,
    replies: (byParent.get(question.id) || []).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    ),
  }));
}

function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read that photo"));
    reader.readAsDataURL(blob);
  });
}

function normalizeVideoUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!resolveLessonVideo(trimmed)) {
    throw new Error("That video link doesn't look right. Paste the Bunny play or embed link.");
  }
  return trimmed.slice(0, 2000);
}

export async function createVillagePost(input: {
  authorId: string;
  authorName: string;
  body: string;
  photos?: File[];
  videoUrl?: string;
  channel?: VillageChannel;
  replyTo?: string | null;
}): Promise<VillagePost> {
  const body = input.body.trim();
  const photos = (input.photos || []).slice(0, MAX_POST_PHOTOS);
  const videoUrl = normalizeVideoUrl(input.videoUrl || "");
  const channel: VillageChannel = input.channel === "ask" ? "ask" : "office";
  const replyTo = input.replyTo || null;
  if (!body && !photos.length && !videoUrl) {
    throw new Error("Write something, add a photo, or paste a video link first");
  }
  if (replyTo && !body) {
    throw new Error("Write a reply first");
  }

  if (!hasLiveBackend()) {
    const urls = await Promise.all(
      photos.map(async (f) => readAsDataUrl(await shrinkPhoto(f, 900, 0.75))),
    );
    const post = normalizePost({
      id: crypto.randomUUID(),
      authorId: input.authorId,
      authorName: input.authorName,
      body,
      createdAt: new Date().toISOString(),
      pinned: false,
      images: urls,
      imageUrls: urls,
      videoUrl,
      channel,
      replyTo,
    });
    writeLocal([post, ...readLocal()]);
    return post;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const uploaded: string[] = [];
  try {
    for (const photo of photos) {
      const blob = await shrinkPhoto(photo);
      const ext = blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1] || "jpg";
      const path = `${input.authorId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
      if (error) {
        throw new Error(
          /bucket not found|row-level security|policy/i.test(error.message)
            ? MEDIA_SQL_HINT
            : `Photo upload failed: ${error.message}`,
        );
      }
      uploaded.push(path);
    }

    const row: Record<string, unknown> = {
      author_id: input.authorId,
      author_name: input.authorName,
      body,
    };
    if (uploaded.length) row.images = uploaded;
    if (videoUrl) row.video_url = videoUrl;

    // Prefer inserts that include channel/reply_to when Ask Becca needs them
    const preferChannel = channel === "ask" || !!replyTo;
    for (const columns of COLUMN_SETS) {
      if (uploaded.length && !columns.includes("images")) break;
      if (videoUrl && !columns.includes("video_url")) break;
      if (preferChannel && !columns.includes("channel")) continue;
      if (replyTo && !columns.includes("reply_to")) continue;

      const insertRow = { ...row };
      if (columns.includes("channel")) insertRow.channel = channel;
      if (columns.includes("reply_to") && replyTo) insertRow.reply_to = replyTo;

      const { data, error } = await supabase
        .from("village_posts")
        .insert(insertRow)
        .select(columns)
        .single();
      if (!error && data) {
        const [post] = await attachPhotoUrls([fromDb(data as unknown as DbPost)]);
        return post;
      }
      if (preferChannel && /channel|reply_to/i.test(error?.message || "")) {
        throw new Error(ASK_SQL_HINT);
      }
      if (
        (uploaded.length || videoUrl) &&
        /images|video_url|check constraint/i.test(error?.message || "")
      ) {
        throw new Error(MEDIA_SQL_HINT);
      }
      if (columns === COLUMN_SETS[COLUMN_SETS.length - 1]) {
        throw new Error(
          preferChannel ? ASK_SQL_HINT : error?.message || "Could not post",
        );
      }
    }
    throw new Error(preferChannel ? ASK_SQL_HINT : MEDIA_SQL_HINT);
  } catch (err) {
    if (uploaded.length) await supabase.storage.from(PHOTO_BUCKET).remove(uploaded);
    throw err;
  }
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

export async function deleteVillagePost(post: Pick<VillagePost, "id" | "images">) {
  if (!hasLiveBackend()) {
    writeLocal(
      readLocal().filter((p) => p.id !== post.id && p.replyTo !== post.id),
    );
    return;
  }
  const supabase = getSupabase();
  if (!supabase) return;

  // Collect reply photos before cascade delete removes the rows
  const paths = [...post.images];
  const { data: replies } = await supabase
    .from("village_posts")
    .select("images")
    .eq("reply_to", post.id);
  for (const r of replies || []) {
    if (Array.isArray(r.images)) paths.push(...r.images);
  }

  const { error } = await supabase.from("village_posts").delete().eq("id", post.id);
  if (error) throw new Error(error.message);
  if (paths.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  }
}
