import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  createEvent,
  deleteEvent,
  eventIcs,
  listEvents,
  type OfficeEvent,
} from "../../lib/eventsRepo";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DURATIONS = [30, 45, 60, 90, 120];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(event: OfficeEvent) {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${start.toLocaleTimeString(undefined, opts)} – ${end.toLocaleTimeString(undefined, { ...opts, timeZoneName: "short" })}`;
}

function downloadIcs(event: OfficeEvent) {
  const blob = new Blob([eventIcs(event)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event"}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CalendarPage() {
  const { user } = useAuth();
  const { preview } = useClientPreview();
  const [events, setEvents] = useState<OfficeEvent[]>([]);
  const [loadError, setLoadError] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "19:00",
    duration: 60,
    link: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  async function refresh() {
    try {
      setEvents(await listEvents());
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load calendar");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, OfficeEvent[]>();
    for (const e of events) {
      const key = dayKey(new Date(e.startsAt));
      map.set(key, [...(map.get(key) || []), e]);
    }
    return map;
  }, [events]);

  if (!user) return <Navigate to="/sign-in" replace />;

  const coach = isAdminEmail(user.email) && !preview;
  const now = Date.now();
  const upcoming = events.filter(
    (e) => new Date(e.startsAt).getTime() + e.durationMinutes * 60_000 >= now,
  );
  const todayKey = dayKey(new Date());
  const listed = selected ? byDay.get(selected) || [] : upcoming;

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setFormMsg("");
    setBusy(true);
    try {
      const startsAt = new Date(`${form.date}T${form.time}`);
      if (Number.isNaN(startsAt.getTime())) throw new Error("Pick a date and time");
      await createEvent({
        title: form.title,
        startsAt: startsAt.toISOString(),
        durationMinutes: form.duration,
        link: form.link,
        description: form.description,
      });
      setForm((f) => ({ ...f, title: "", link: "", description: "" }));
      setFormMsg("Added to the calendar ♡");
      setMonth(new Date(startsAt.getFullYear(), startsAt.getMonth(), 1));
      await refresh();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    try {
      await deleteEvent(id);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Calendar</p>
      <h1>
        What&apos;s <em>on</em>
      </h1>
      <p className="portal-lede">
        LIVE sessions, Office meetups, and deadlines. Times show in your own
        time zone — add any session straight to your calendar.
      </p>

      {loadError && coach && <p className="form-error">{loadError}</p>}

      {coach && (
        <form className="office-composer calendar-form" onSubmit={(e) => void onCreate(e)}>
          <p className="calendar-form__title">Add an event</p>
          <label className="calc-field calendar-form__wide">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="LIVE Q&A — Seen. Heard. Earn."
              required
            />
          </label>
          <label className="calc-field">
            <span>Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </label>
          <label className="calc-field">
            <span>Start time (your time)</span>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
            />
          </label>
          <label className="calc-field">
            <span>Length</span>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d < 60 ? `${d} min` : `${d / 60} hr${d > 60 ? "s" : ""}`}
                </option>
              ))}
            </select>
          </label>
          <label className="calc-field">
            <span>Join link (optional)</span>
            <input
              type="url"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://zoom.us/…"
            />
          </label>
          <label className="calc-field calendar-form__wide">
            <span>Details (optional)</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What to bring, what we'll cover…"
            />
          </label>
          <div className="calendar-form__wide calendar-form__actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Add to calendar →"}
            </button>
            {formMsg && <p className="form-status">{formMsg}</p>}
          </div>
        </form>
      )}

      <div className="calendar">
        <section className="calendar__month" aria-label="Month view">
          <div className="calendar__month-head">
            <button
              className="btn btn--ghost-ink"
              type="button"
              aria-label="Previous month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              ←
            </button>
            <h2>
              {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <button
              className="btn btn--ghost-ink"
              type="button"
              aria-label="Next month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              →
            </button>
          </div>
          <div className="calendar__grid">
            {WEEKDAYS.map((d) => (
              <span className="calendar__weekday" key={d}>
                {d}
              </span>
            ))}
            {monthDays(month).map((d) => {
              const key = dayKey(d);
              const dayEvents = byDay.get(key) || [];
              const classes = [
                "calendar__day",
                d.getMonth() !== month.getMonth() ? "is-outside" : "",
                key === todayKey ? "is-today" : "",
                key === selected ? "is-selected" : "",
                dayEvents.length ? "has-events" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={key}
                  type="button"
                  className={classes}
                  onClick={() => setSelected(key === selected ? null : key)}
                  aria-label={`${d.toDateString()}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}`}
                >
                  <span className="calendar__date">{d.getDate()}</span>
                  {dayEvents.slice(0, 2).map((e) => (
                    <span className="calendar__chip" key={e.id}>
                      {e.title}
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="calendar__more">+{dayEvents.length - 2}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="calendar__list" aria-label="Events">
          <div className="calendar__list-head">
            <h2>{selected ? "That day" : "Coming up"}</h2>
            {selected && (
              <button className="btn btn--ghost-ink" type="button" onClick={() => setSelected(null)}>
                Show all upcoming
              </button>
            )}
          </div>
          {listed.length === 0 ? (
            <div className="studio-empty">
              <h3>{selected ? "Nothing on this day" : "Nothing scheduled yet"}</h3>
              <p>
                {coach
                  ? "Add a LIVE session or deadline above and it shows here for every member."
                  : "Becca will add LIVE sessions and deadlines here — check back soon."}
              </p>
            </div>
          ) : (
            listed.map((e) => (
              <article className="calendar-event" key={e.id}>
                <div className="calendar-event__date">
                  <span>{new Date(e.startsAt).toLocaleDateString(undefined, { month: "short" })}</span>
                  <strong>{new Date(e.startsAt).getDate()}</strong>
                </div>
                <div className="calendar-event__body">
                  <h3>{e.title}</h3>
                  <p className="calendar-event__when">
                    {formatDay(e.startsAt)} · {formatTime(e)}
                  </p>
                  {e.description && <p>{e.description}</p>}
                  <div className="office-post__actions">
                    {e.link && (
                      <a className="btn btn--primary" href={e.link} target="_blank" rel="noreferrer">
                        Join →
                      </a>
                    )}
                    <button className="btn btn--ghost-ink" type="button" onClick={() => downloadIcs(e)}>
                      Add to my calendar
                    </button>
                    {coach && (
                      <button className="btn btn--ghost-ink" type="button" onClick={() => void onDelete(e.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
