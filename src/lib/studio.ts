import type { CourseLesson, CourseTrack } from "../data/courses";
import { COURSE_TRACKS } from "../data/courses";

export type StudioLesson = CourseLesson & {
  studio?: true;
};

export type StudioTrack = Omit<CourseTrack, "lessons"> & {
  studio?: true;
  published: boolean;
  /** Built-in course id this overrides, if any */
  overridesId?: string;
  lessons: StudioLesson[];
};

export type NavTopicId =
  | "home"
  | "courses"
  | "vault"
  | "calculators"
  | "toolkit"
  | "office"
  | "studio"
  | "account";

export type NavSettings = Record<NavTopicId, boolean>;

const STUDIO_KEY = "bbb_studio_tracks_v1";
const NAV_KEY = "bbb_nav_topics_v1";

export const DEFAULT_NAV: NavSettings = {
  home: true,
  courses: true,
  vault: true,
  calculators: true,
  toolkit: true,
  office: true,
  studio: true,
  account: true,
};

export const NAV_META: {
  id: NavTopicId;
  label: string;
  group: string;
  adminOnly?: boolean;
}[] = [
  { id: "home", label: "Home", group: "Learn" },
  { id: "courses", label: "Courses", group: "Learn" },
  { id: "vault", label: "Vault", group: "Learn" },
  { id: "office", label: "The Office", group: "Learn" },
  { id: "calculators", label: "Calculators", group: "Build" },
  { id: "toolkit", label: "Toolkit", group: "Build" },
  { id: "studio", label: "Studio", group: "Create", adminOnly: true },
  { id: "account", label: "Account", group: "You" },
];

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

function readNav(): NavSettings {
  try {
    const raw = localStorage.getItem(NAV_KEY);
    if (!raw) return { ...DEFAULT_NAV };
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const { village, ...rest } = parsed;
    const merged = { ...DEFAULT_NAV, ...rest } as NavSettings;
    if (typeof village === "boolean" && rest.office === undefined) {
      merged.office = village;
    }
    return merged;
  } catch {
    return { ...DEFAULT_NAV };
  }
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
  /** Copy a built-in program into Studio so it can be fully edited. */
  editBuiltin(builtinId: string): StudioTrack {
    const existing = readStudio().find(
      (t) => t.id === builtinId || t.overridesId === builtinId,
    );
    if (existing) return existing;

    const builtin = COURSE_TRACKS.find((t) => t.id === builtinId);
    if (!builtin) throw new Error("Program not found");

    const track: StudioTrack = {
      id: builtin.id,
      title: builtin.title,
      blurb: builtin.blurb,
      badge: builtin.badge,
      membersOnly: builtin.membersOnly,
      published: true,
      studio: true,
      overridesId: builtin.id,
      lessons: builtin.lessons.map((l) => ({ ...l, studio: true as const })),
    };
    this.upsertTrack(track);
    return track;
  },
  getNavSettings(): NavSettings {
    return readNav();
  },
  saveNavSettings(settings: NavSettings) {
    localStorage.setItem(NAV_KEY, JSON.stringify(settings));
    return settings;
  },
};

function toCourseTrack(t: StudioTrack): CourseTrack {
  return {
    id: t.id,
    title: t.title,
    blurb: t.blurb,
    badge: t.badge || (t.published ? "Member course" : "Draft"),
    membersOnly: t.membersOnly,
    lessons: t.lessons,
  };
}

/** Studio overrides replace built-ins with the same id; then remaining built-ins. */
export function getAllTracks(opts?: { includeDrafts?: boolean }): CourseTrack[] {
  const studio = studioStore
    .list()
    .filter((t) => (opts?.includeDrafts ? true : t.published));

  const overridden = new Set(
    studio.flatMap((t) => [t.id, t.overridesId].filter(Boolean) as string[]),
  );

  const fromStudio = studio.map(toCourseTrack);
  const builtins = COURSE_TRACKS.filter((t) => !overridden.has(t.id));
  return [...fromStudio, ...builtins];
}

export function getMergedTrack(trackId: string, includeDrafts = false) {
  return getAllTracks({ includeDrafts }).find((t) => t.id === trackId);
}

export function listProgramsForStudio(): {
  id: string;
  title: string;
  blurb: string;
  lessonCount: number;
  source: "builtin" | "studio";
  published: boolean;
  editableId: string;
}[] {
  const studio = studioStore.list();
  const studioByOverride = new Map(
    studio.map((t) => [t.overridesId || t.id, t]),
  );

  const builtinRows = COURSE_TRACKS.map((t) => {
    const override = studioByOverride.get(t.id);
    if (override) {
      return {
        id: t.id,
        title: override.title,
        blurb: override.blurb,
        lessonCount: override.lessons.length,
        source: "studio" as const,
        published: override.published,
        editableId: override.id,
      };
    }
    return {
      id: t.id,
      title: t.title,
      blurb: t.blurb,
      lessonCount: t.lessons.length,
      source: "builtin" as const,
      published: true,
      editableId: t.id,
    };
  });

  const customOnly = studio
    .filter(
      (t) =>
        !COURSE_TRACKS.some((b) => b.id === t.id || b.id === t.overridesId),
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      blurb: t.blurb,
      lessonCount: t.lessons.length,
      source: "studio" as const,
      published: t.published,
      editableId: t.id,
    }));

  return [...builtinRows, ...customOnly];
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
    blurb: "Describe what members will learn in this course.",
    badge: "Draft",
    membersOnly: true,
    published: false,
    studio: true,
    lessons: [emptyLesson(`${id}-l1`)],
  };
}
