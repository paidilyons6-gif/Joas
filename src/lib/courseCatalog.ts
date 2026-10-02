import { useEffect, useState } from "react";
import { COURSE_TRACKS, type CourseTrack } from "../data/courses";
import {
  getAllTracks as getLocalTracks,
  getMergedTrack as getLocalMerged,
  studioStore,
} from "./studio";
import { fetchTracks } from "./coursesRepo";

let cachedTracks: CourseTrack[] | null = null;
let loadPromise: Promise<CourseTrack[]> | null = null;

export function invalidateCatalog() {
  cachedTracks = null;
  loadPromise = null;
}

export function trackProgressFromTrack(track: CourseTrack, completed: string[]) {
  const total = track.lessons.length;
  const done = track.lessons.filter((l) => completed.includes(l.id)).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** Sync catalog: remote cache when loaded, else local Studio/builtins (demo/offline). */
export function getAllTracks(opts?: { includeDrafts?: boolean }): CourseTrack[] {
  if (cachedTracks && !opts?.includeDrafts) {
    return cachedTracks;
  }
  return getLocalTracks(opts);
}

export function getMergedTrack(trackId: string, includeDrafts = false) {
  return (
    getAllTracks({ includeDrafts }).find((t) => t.id === trackId) ||
    getLocalMerged(trackId, includeDrafts)
  );
}

export function allLessonsMerged(includeDrafts = false) {
  return getAllTracks({ includeDrafts }).flatMap((t) =>
    t.lessons.map((l) => ({ ...l, trackId: t.id, trackTitle: t.title })),
  );
}

export function nextLessonMerged(completed: string[]) {
  for (const track of getAllTracks()) {
    for (const lesson of track.lessons) {
      if (!completed.includes(lesson.id)) {
        return { track, lesson };
      }
    }
  }
  return null;
}

/** Load published tracks from Supabase (or local fallback). Updates sync getters. */
export async function loadCatalog(opts?: {
  includeDrafts?: boolean;
}): Promise<CourseTrack[]> {
  if (!opts?.includeDrafts && loadPromise) return loadPromise;

  const run = (async () => {
    const tracks = await fetchTracks(opts);
    if (!opts?.includeDrafts) {
      cachedTracks = tracks;
    }
    return tracks;
  })();

  if (!opts?.includeDrafts) {
    loadPromise = run.finally(() => {
      loadPromise = null;
    });
    return loadPromise;
  }
  return run;
}

/** Portal hook: published courses from Supabase for every signed-in user. */
export function usePublishedTracks() {
  const [tracks, setTracks] = useState<CourseTrack[]>(() => getAllTracks());
  const [loading, setLoading] = useState(!cachedTracks);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadCatalog().then((list) => {
      if (!cancelled) {
        setTracks(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { tracks, loading };
}

export function useTrack(trackId: string | undefined) {
  const [track, setTrack] = useState<CourseTrack | null | undefined>(() =>
    trackId ? getMergedTrack(trackId) ?? undefined : undefined,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackId) {
      setTrack(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadCatalog().then((list) => {
      if (cancelled) return;
      setTrack(list.find((t) => t.id === trackId) ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [trackId]);

  return { track, loading };
}

export { COURSE_TRACKS, studioStore };
