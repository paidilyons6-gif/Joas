import { COURSE_TRACKS, type CourseTrack } from "../data/courses";
import { getAllTracks, getMergedTrack, studioStore } from "./studio";

export function trackProgressFromTrack(track: CourseTrack, completed: string[]) {
  const total = track.lessons.length;
  const done = track.lessons.filter((l) => completed.includes(l.id)).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
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

export {
  COURSE_TRACKS,
  getAllTracks,
  getMergedTrack,
  studioStore,
};
