import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "r.lyons1@icloud.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const TRACK = {
  id: "seen-heard-earn",
  title: "Seen. Heard. Earn.",
  blurb:
    "Your 3-day brand workshop — lifetime access in The Office. Opens October 14th.",
  badge: "3-day workshop",
  members_only: true,
  published: true,
  sort_order: 0,
};

const LESSONS = [
  {
    id: "she-day-1",
    track_id: "seen-heard-earn",
    title: "Day 1 — Seen.",
    duration: 45,
    members_only: true,
    video_url: "",
    objectives: ["Get clear on how you want to be seen as a brand"],
    sections: [
      {
        heading: "Welcome to Day 1",
        body: "Today we get you Seen. Edit this in Studio and add video before October 14.",
      },
    ],
    action:
      "Write one sentence that says who you help and what they walk away with.",
    worksheet_prompt: "Brand visibility notes…",
    sort_order: 0,
  },
  {
    id: "she-day-2",
    track_id: "seen-heard-earn",
    title: "Day 2 — Heard.",
    duration: 45,
    members_only: true,
    video_url: "",
    objectives: ["Shape a message people actually remember"],
    sections: [
      {
        heading: "Welcome to Day 2",
        body: "Today we get you Heard. Edit this in Studio and add video before October 14.",
      },
    ],
    action: "Draft your core offer paragraph out loud, then tighten it.",
    worksheet_prompt: "Message and offer notes…",
    sort_order: 1,
  },
  {
    id: "she-day-3",
    track_id: "seen-heard-earn",
    title: "Day 3 — Earn.",
    duration: 45,
    members_only: true,
    video_url: "",
    objectives: ["Connect your brand to paid opportunities"],
    sections: [
      {
        heading: "Welcome to Day 3",
        body: "Today we get you Earn. Edit this in Studio and add video before October 14.",
      },
    ],
    action: "Write your next paid ask and who you will send it to this week.",
    worksheet_prompt: "Earn plan notes…",
    sort_order: 2,
  },
];

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
  const { error: trackError } = await supabase.from("course_tracks").upsert({
    ...TRACK,
    updated_at: new Date().toISOString(),
  });

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
    const { error } = await supabase.from("course_lessons").upsert({
      ...lesson,
      updated_at: new Date().toISOString(),
    });
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
