import { getSupabase } from "./supabase";
import { demoStore, hasLiveBackend } from "./demo";

export type UserDrafts = {
  toolDrafts: Record<string, unknown>;
  calcState: Record<string, Record<string, number | string>>;
  lessonNotes: Record<string, string>;
};

const NOTES_KEY = "bbb_lesson_notes_v1";

function readNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

export async function loadDrafts(userId: string): Promise<UserDrafts> {
  const local: UserDrafts = {
    toolDrafts: demoStore.getToolDrafts() as Record<string, unknown>,
    calcState: demoStore.getCalcState(),
    lessonNotes: readNotes(),
  };

  if (!hasLiveBackend()) return local;
  const supabase = getSupabase();
  if (!supabase) return local;

  const { data } = await supabase
    .from("user_drafts")
    .select("tool_drafts, calc_state, lesson_notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return local;
  return {
    toolDrafts: (data.tool_drafts as Record<string, unknown>) || local.toolDrafts,
    calcState:
      (data.calc_state as Record<string, Record<string, number | string>>) ||
      local.calcState,
    lessonNotes:
      (data.lesson_notes as Record<string, string>) || local.lessonNotes,
  };
}

export async function saveDrafts(userId: string, drafts: UserDrafts) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(drafts.lessonNotes));
  // tool + calc already written by demoStore callers

  if (!hasLiveBackend()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("user_drafts").upsert({
    user_id: userId,
    tool_drafts: drafts.toolDrafts,
    calc_state: drafts.calcState,
    lesson_notes: drafts.lessonNotes,
    updated_at: new Date().toISOString(),
  });
}

export async function saveLessonNote(
  userId: string,
  lessonId: string,
  note: string,
) {
  const drafts = await loadDrafts(userId);
  drafts.lessonNotes[lessonId] = note;
  await saveDrafts(userId, drafts);
}

export async function syncToolDraftsRemote(userId: string) {
  const drafts = await loadDrafts(userId);
  drafts.toolDrafts = demoStore.getToolDrafts() as Record<string, unknown>;
  await saveDrafts(userId, drafts);
}

export async function syncCalcStateRemote(userId: string) {
  const drafts = await loadDrafts(userId);
  drafts.calcState = demoStore.getCalcState();
  await saveDrafts(userId, drafts);
}
