import { getSupabase } from "./supabase";
import { hasLiveBackend } from "./demo";

export type OfficeEvent = {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  description: string;
  link: string;
};

const LOCAL_KEY = "bbb_office_events_v1";
const COLUMNS = "id, title, starts_at, duration_minutes, description, link";

type DbEvent = {
  id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
  description: string;
  link: string;
};

function fromDb(row: DbEvent): OfficeEvent {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    description: row.description || "",
    link: row.link || "",
  };
}

function sortEvents(events: OfficeEvent[]) {
  return [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function readLocal(): OfficeEvent[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as OfficeEvent[];
  } catch {
    return [];
  }
}

function writeLocal(events: OfficeEvent[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(events));
}

function missingTable(message: string) {
  return message.includes("office_events")
    ? "Run supabase/migrations/014_office_calendar.sql in Supabase to turn on the calendar."
    : message;
}

export async function listEvents(): Promise<OfficeEvent[]> {
  const supabase = hasLiveBackend() ? getSupabase() : null;
  if (!supabase) return sortEvents(readLocal());
  const { data, error } = await supabase
    .from("office_events")
    .select(COLUMNS)
    .order("starts_at", { ascending: true });
  if (error) throw new Error(missingTable(error.message));
  return (data as DbEvent[]).map(fromDb);
}

export async function createEvent(
  input: Omit<OfficeEvent, "id">,
): Promise<OfficeEvent> {
  const title = input.title.trim();
  if (!title) throw new Error("Give the event a title");

  const supabase = hasLiveBackend() ? getSupabase() : null;
  if (!supabase) {
    const event = { ...input, title, id: crypto.randomUUID() };
    writeLocal(sortEvents([...readLocal(), event]));
    return event;
  }
  const { data, error } = await supabase
    .from("office_events")
    .insert({
      title,
      starts_at: input.startsAt,
      duration_minutes: input.durationMinutes,
      description: input.description.trim(),
      link: input.link.trim(),
    })
    .select(COLUMNS)
    .single();
  if (error || !data) throw new Error(missingTable(error?.message || "Could not save"));
  return fromDb(data as DbEvent);
}

export async function deleteEvent(id: string) {
  const supabase = hasLiveBackend() ? getSupabase() : null;
  if (!supabase) {
    writeLocal(readLocal().filter((e) => e.id !== id));
    return;
  }
  const { error } = await supabase.from("office_events").delete().eq("id", id);
  if (error) throw new Error(missingTable(error.message));
}

function icsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, "\\$&");
}

/** Downloadable .ics so members can add a session to their own calendar. */
export function eventIcs(event: OfficeEvent) {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  const description = [event.description, event.link].filter(Boolean).join("\n\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BusinessByBecca//The Office//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@businessbybecca`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(event.title)}`,
    description ? `DESCRIPTION:${icsText(description)}` : "",
    event.link ? `URL:${event.link}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
