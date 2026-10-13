import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { SEEN_HEARD_EARN_TRACK } from "../../src/data/seenHeardEarnCourse";

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "r.lyons1@icloud.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const TRACK = {
  id: "seen-heard-earn",
  title: "Seen. Heard. Earn.",
  blurb:
    "Your 3-day brand workshop — lifetime access in The Office.",
  badge: "3-day workshop",
  members_only: true,
  published: true,
  sort_order: 0,
};

const LESSONS = SEEN_HEARD_EARN_TRACK.lessons.map((lesson, index) => ({
  id: lesson.id,
  track_id: TRACK.id,
  title: lesson.title,
  duration: lesson.duration,
  members_only: lesson.membersOnly,
  video_url: lesson.videoUrl || "",
  objectives: lesson.objectives,
  sections: lesson.sections,
  action: lesson.action,
  worksheet_prompt: lesson.worksheetPrompt,
  sort_order: index,
}));

/** Admin-only: upsert Seen. Heard. Earn. course into Supabase CMS tables. */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const secret = process.env.STUDIO_PRICE_SECRET;
  if (!secret) {
    return { statusCode: 503, body: "Set STUDIO_PRICE_SECRET on Netlify." };
  }

  let email = "";
  let provided = "";
  try {
    const body = JSON.parse(event.body || "{}") as {
      email?: string;
      secret?: string;
    };
    email = (body.email || "").trim().toLowerCase();
    provided = body.secret || "";
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!ADMIN_EMAILS.includes(email) || provided !== secret) {
    return { statusCode: 403, body: "Not authorized" };
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { statusCode: 503, body: "Supabase is not configured." };
  }

  const supabase = createClient(url, key);
  const { error: trackError } = await supabase.from("course_tracks").upsert(
    { ...TRACK, updated_at: new Date().toISOString() },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (trackError) {
    return {
      statusCode: 500,
      body:
        trackError.message.includes("course_tracks") ||
        trackError.code === "PGRST205"
          ? "Run supabase/migrations/013_course_cms_and_seen_heard_earn.sql in the Supabase SQL Editor, then retry."
          : trackError.message,
    };
  }

  for (const lesson of LESSONS) {
    const { error } = await supabase.from("course_lessons").upsert(
      { ...lesson, updated_at: new Date().toISOString() },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) {
      return { statusCode: 500, body: error.message };
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      trackId: TRACK.id,
      lessons: LESSONS.length,
    }),
  };
};
