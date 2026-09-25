import { getSupabase } from "./supabase";
import { hasLiveBackend } from "./demo";
import type { CourseLesson, CourseTrack } from "../data/courses";
import { COURSE_TRACKS } from "../data/courses";
import type { NavSettings, StudioTrack } from "./studio";
import { DEFAULT_NAV, studioStore } from "./studio";
import {
  DEFAULT_SITE_COPY,
  siteCopyStore,
  type SiteCopy,
} from "./siteCopy";

type DbTrack = {
  id: string;
  title: string;
  blurb: string;
  badge: string;
  members_only: boolean;
  published: boolean;
  sort_order: number;
};

type DbLesson = {
  id: string;
  track_id: string;
  title: string;
  duration: number;
  members_only: boolean;
  objectives: string[];
  sections: { heading: string; body: string }[];
  action: string;
  worksheet_prompt: string;
  sort_order: number;
};

function studioToCourse(t: StudioTrack): CourseTrack {
  return {
    id: t.id,
    title: t.title,
    blurb: t.blurb,
    badge: t.badge,
    membersOnly: t.membersOnly,
    lessons: t.lessons,
  };
}

export async function fetchTracks(opts?: {
  includeDrafts?: boolean;
}): Promise<CourseTrack[]> {
  if (!hasLiveBackend()) {
    return mergeLocal(opts?.includeDrafts);
  }

  const supabase = getSupabase();
  if (!supabase) return mergeLocal(opts?.includeDrafts);

  let trackQuery = supabase
    .from("course_tracks")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!opts?.includeDrafts) {
    trackQuery = trackQuery.eq("published", true);
  }

  const { data: tracks, error } = await trackQuery;
  if (error || !tracks?.length) {
    // Seed then retry once from builtins if empty
    if (!error) await seedBuiltinTracks();
    const fallback = await trackQuery;
    if (!fallback.data?.length) return mergeLocal(opts?.includeDrafts);
    return hydrateTracks(fallback.data as DbTrack[], opts?.includeDrafts);
  }

  return hydrateTracks(tracks as DbTrack[], opts?.includeDrafts);
}

async function hydrateTracks(
  tracks: DbTrack[],
  includeDrafts?: boolean,
): Promise<CourseTrack[]> {
  const supabase = getSupabase()!;
  const ids = tracks.map((t) => t.id);
  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("*")
    .in("track_id", ids)
    .order("sort_order", { ascending: true });

  const byTrack = new Map<string, CourseLesson[]>();
  for (const l of (lessons || []) as DbLesson[]) {
    const list = byTrack.get(l.track_id) || [];
    list.push({
      id: l.id,
      title: l.title,
      duration: l.duration,
      membersOnly: l.members_only,
      objectives: l.objectives || [],
      sections: (l.sections as CourseLesson["sections"]) || [],
      action: l.action || "",
      worksheetPrompt: l.worksheet_prompt || "",
    });
    byTrack.set(l.track_id, list);
  }

  return tracks
    .filter((t) => includeDrafts || t.published)
    .map((t) => ({
      id: t.id,
      title: t.title,
      blurb: t.blurb,
      badge: t.badge,
      membersOnly: t.members_only,
      lessons: byTrack.get(t.id) || [],
    }));
}

function mergeLocal(includeDrafts?: boolean): CourseTrack[] {
  const studio = studioStore
    .list()
    .filter((t) => (includeDrafts ? true : t.published));
  const overridden = new Set(
    studio.flatMap((t) => [t.id, t.overridesId].filter(Boolean) as string[]),
  );
  return [
    ...studio.map(studioToCourse),
    ...COURSE_TRACKS.filter((t) => !overridden.has(t.id)),
  ];
}

export async function seedBuiltinTracks() {
  if (!hasLiveBackend()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  for (let i = 0; i < COURSE_TRACKS.length; i++) {
    const t = COURSE_TRACKS[i]!;
    await supabase.from("course_tracks").upsert({
      id: t.id,
      title: t.title,
      blurb: t.blurb,
      badge: t.badge,
      members_only: t.membersOnly,
      published: true,
      sort_order: i,
      updated_at: new Date().toISOString(),
    });
    for (let j = 0; j < t.lessons.length; j++) {
      const l = t.lessons[j]!;
      await supabase.from("course_lessons").upsert({
        id: l.id,
        track_id: t.id,
        title: l.title,
        duration: l.duration,
        members_only: l.membersOnly,
        objectives: l.objectives,
        sections: l.sections,
        action: l.action,
        worksheet_prompt: l.worksheetPrompt,
        sort_order: j,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

export async function saveStudioTrackRemote(track: StudioTrack) {
  studioStore.upsertTrack(track);
  if (!hasLiveBackend()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("course_tracks").upsert({
    id: track.id,
    title: track.title,
    blurb: track.blurb,
    badge: track.badge,
    members_only: track.membersOnly,
    published: track.published,
    sort_order: 0,
    updated_at: new Date().toISOString(),
  });

  // Replace lessons for track
  await supabase.from("course_lessons").delete().eq("track_id", track.id);
  for (let j = 0; j < track.lessons.length; j++) {
    const l = track.lessons[j]!;
    await supabase.from("course_lessons").upsert({
      id: l.id,
      track_id: track.id,
      title: l.title,
      duration: l.duration,
      members_only: l.membersOnly,
      objectives: l.objectives,
      sections: l.sections,
      action: l.action,
      worksheet_prompt: l.worksheetPrompt,
      sort_order: j,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function deleteStudioTrackRemote(id: string) {
  studioStore.deleteTrack(id);
  if (!hasLiveBackend()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("course_tracks").delete().eq("id", id);
}

export async function fetchNavSettings(): Promise<NavSettings> {
  if (!hasLiveBackend()) return studioStore.getNavSettings();
  const supabase = getSupabase();
  if (!supabase) return studioStore.getNavSettings();
  const { data } = await supabase
    .from("site_settings")
    .select("nav")
    .eq("id", "main")
    .maybeSingle();
  if (!data?.nav) return studioStore.getNavSettings();
  const raw = data.nav as Record<string, boolean>;
  const { village, ...rest } = raw;
  const merged = { ...DEFAULT_NAV, ...rest } as NavSettings;
  if (typeof village === "boolean" && rest.office === undefined) {
    merged.office = village;
  }
  return merged;
}

export async function saveNavSettingsRemote(nav: NavSettings) {
  studioStore.saveNavSettings(nav);
  window.dispatchEvent(new Event("bbb-nav-updated"));
  if (!hasLiveBackend()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("site_settings")
    .upsert({ id: "main", nav, updated_at: new Date().toISOString() });
}

export async function fetchSiteCopy(): Promise<SiteCopy> {
  if (!hasLiveBackend()) return siteCopyStore.get();
  const supabase = getSupabase();
  if (!supabase) return siteCopyStore.get();
  const { data } = await supabase
    .from("site_settings")
    .select("copy")
    .eq("id", "main")
    .maybeSingle();
  if (!data?.copy) return siteCopyStore.get();
  const merged = {
    ...DEFAULT_SITE_COPY,
    ...(data.copy as Partial<SiteCopy>),
    checklist: Array.isArray((data.copy as SiteCopy).checklist)
      ? (data.copy as SiteCopy).checklist
      : DEFAULT_SITE_COPY.checklist,
  };
  siteCopyStore.save(merged);
  return merged;
}

export async function saveSiteCopyRemote(copy: SiteCopy) {
  siteCopyStore.save(copy);
  if (!hasLiveBackend()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("site_settings").upsert({
    id: "main",
    copy,
    updated_at: new Date().toISOString(),
  });
}
