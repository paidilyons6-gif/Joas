import type { CourseLesson, CourseTrack } from "../data/courses";
import { COURSE_TRACKS } from "../data/courses";

export type StudioLesson = CourseLesson & {
  studio?: true;
};

export type StudioTrack = Omit<CourseTrack, "lessons"> & {
  studio?: true;
  published: boolean;
  lessons: StudioLesson[];
};

const STUDIO_KEY = "bbb_studio_tracks_v1";

function readStudio(): StudioTrack[] {
  try {
    const raw = localStorage.getItem(STUDIO_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StudioTrack[];
  } catch {
    return [];
  }
}

function writeStudio(tracks: StudioTrack[]) {
  localStorage.setItem(STUDIO_KEY, JSON.stringify(tracks));
}

export const studioStore = {
  list(): StudioTrack[] {
    return readStudio();
  },
  save(tracks: StudioTrack[]) {
    writeStudio(tracks);
    return tracks;
  },
  upsertTrack(track: StudioTrack) {
    const tracks = readStudio();
    const idx = tracks.findIndex((t) => t.id === track.id);
    if (idx >= 0) tracks[idx] = track;
    else tracks.unshift(track);
    return this.save(tracks);
  },
  deleteTrack(id: string) {
    return this.save(readStudio().filter((t) => t.id !== id));
  },
  getTrack(id: string) {
    return readStudio().find((t) => t.id === id) || null;
  },
};

/** Built-in + published studio tracks (or all studio for admins). */
export function getAllTracks(opts?: { includeDrafts?: boolean }): CourseTrack[] {
  const studio = studioStore.list().filter((t) =>
    opts?.includeDrafts ? true : t.published,
  );
  const mapped: CourseTrack[] = studio.map((t) => ({
    id: t.id,
    title: t.title,
    blurb: t.blurb,
    badge: t.badge || (t.published ? "Village course" : "Draft"),
    membersOnly: t.membersOnly,
    lessons: t.lessons,
  }));
  return [...mapped, ...COURSE_TRACKS];
}

export function getMergedTrack(trackId: string, includeDrafts = false) {
  return getAllTracks({ includeDrafts }).find((t) => t.id === trackId);
}

export function emptyLesson(id: string): StudioLesson {
  return {
    id,
    title: "New lesson",
    duration: 10,
    membersOnly: true,
    objectives: ["What members will walk away with"],
    sections: [
      {
        heading: "Lesson content",
        body: "Write the teaching here — keep it clear, warm, and actionable.",
      },
    ],
    action: "Tell them the one thing to do next.",
    worksheetPrompt: "Prompt for their notes…",
    studio: true,
  };
}

export function emptyTrack(): StudioTrack {
  const id = `studio-${crypto.randomUUID().slice(0, 8)}`;
  return {
    id,
    title: "Untitled course",
    blurb: "Describe what members will learn in this village course.",
    badge: "Draft",
    membersOnly: true,
    published: false,
    studio: true,
    lessons: [emptyLesson(`${id}-l1`)],
  };
}
