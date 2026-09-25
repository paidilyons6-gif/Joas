import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  LAUNCH_DAYS,
  defaultClientDraft,
  defaultOfferDraft,
  defaultScorecard,
  getTool,
  type ToolId,
} from "../../data/tools";
import { useAuth } from "../../lib/auth";
import { hasAnyProgram } from "../../lib/access";
import { demoStore } from "../../lib/demo";
import { syncToolDraftsRemote } from "../../lib/draftsRepo";

export function ToolPage() {
  const { toolId } = useParams();
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;

  const tool = getTool(toolId || "");
  if (!tool) return <Navigate to="/portal/tools" replace />;
  if (tool.membersOnly && !hasAnyProgram(user.programs)) {
    return <Navigate to="/programs" replace />;
  }

  return (
    <div className="portal-page">
      <Link className="back-link" to="/portal/tools">
        ← Toolkit
      </Link>
      <p className="eyebrow">{tool.badge}</p>
      <h1>{tool.title}</h1>
      <p className="portal-lede">{tool.blurb}</p>
      <ToolBody id={tool.id} userId={user.id} />
    </div>
  );
}

function ToolBody({ id, userId }: { id: ToolId; userId: string }) {
  if (id === "offer-builder") return <OfferBuilder userId={userId} />;
  if (id === "ideal-client") return <IdealClient userId={userId} />;
  if (id === "launch-planner") return <LaunchPlanner userId={userId} />;
  return <CeoScorecard userId={userId} />;
}

function useDraft<T extends Record<string, string>>(
  key: "offer-builder" | "ideal-client" | "ceo-scorecard",
  defaults: T,
  userId: string,
) {
  const saved = demoStore.getToolDrafts()[key] as T | undefined;
  const [draft, setDraft] = useState<T>({ ...defaults, ...saved });
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    demoStore.saveToolDraft(key, draft);
  }, [key, draft]);

  function update(field: keyof T, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function saveNow() {
    demoStore.saveToolDraft(key, draft);
    void syncToolDraftsRemote(userId);
    setSavedNote("Saved ♡");
    window.setTimeout(() => setSavedNote(""), 2000);
  }

  return { draft, update, saveNow, savedNote };
}

function OfferBuilder({ userId }: { userId: string }) {
  const { draft, update, saveNow, savedNote } = useDraft(
    "offer-builder",
    defaultOfferDraft,
    userId,
  );

  return (
    <div className="tool-form">
      {(
        [
          ["name", "Offer name"],
          ["who", "Who it's for"],
          ["pain", "Painful now"],
          ["promise", "Promise / result"],
          ["price", "Price"],
          ["delivery", "Delivery / timeline"],
        ] as const
      ).map(([field, label]) => (
        <label key={field} className="calc-field">
          <span>{label}</span>
          <textarea
            rows={field === "delivery" || field === "promise" ? 3 : 2}
            value={draft[field]}
            onChange={(e) => update(field, e.target.value)}
          />
        </label>
      ))}
      <div className="account-actions">
        <button className="btn btn--primary" type="button" onClick={saveNow}>
          Save draft
        </button>
        {savedNote && <p className="form-status">{savedNote}</p>}
      </div>
      <div className="lesson-panel">
        <h2>Live preview</h2>
        <p>
          <strong>{draft.name || "Untitled offer"}</strong> helps{" "}
          {draft.who || "___"} go from {draft.pain || "___"} to{" "}
          {draft.promise || "___"} for {draft.price || "$___"} — delivered via{" "}
          {draft.delivery || "___"}.
        </p>
      </div>
    </div>
  );
}

function IdealClient({ userId }: { userId: string }) {
  const { draft, update, saveNow, savedNote } = useDraft(
    "ideal-client",
    defaultClientDraft,
    userId,
  );

  return (
    <div className="tool-form">
      {(
        [
          ["who", "Who she is"],
          ["ageLife", "Life season"],
          ["pains", "Top pains"],
          ["desires", "Desires / wins"],
          ["hangouts", "Where she hangs out"],
          ["language", "Words she uses"],
        ] as const
      ).map(([field, label]) => (
        <label key={field} className="calc-field">
          <span>{label}</span>
          <textarea
            rows={3}
            value={draft[field]}
            onChange={(e) => update(field, e.target.value)}
          />
        </label>
      ))}
      <div className="account-actions">
        <button className="btn btn--primary" type="button" onClick={saveNow}>
          Save sketch
        </button>
        {savedNote && <p className="form-status">{savedNote}</p>}
      </div>
    </div>
  );
}

function LaunchPlanner({ userId }: { userId: string }) {
  const saved = demoStore.getToolDrafts()["launch-planner"];
  const [checked, setChecked] = useState<string[]>(saved?.checked || []);
  const [note, setNote] = useState("");

  function toggle(id: string) {
    setChecked((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      demoStore.saveToolDraft("launch-planner", { checked: next });
      return next;
    });
  }

  function save() {
    demoStore.saveToolDraft("launch-planner", { checked });
    void syncToolDraftsRemote(userId);
    setNote("Progress saved ♡");
    window.setTimeout(() => setNote(""), 2000);
  }

  const total = LAUNCH_DAYS.reduce((sum, d) => sum + d.tasks.length, 0);
  const done = checked.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="tool-form">
      <div className="stat" style={{ marginBottom: "1rem" }}>
        <p className="stat__label">Launch progress</p>
        <p className="stat__value">{pct}%</p>
        <div className="progress-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      {LAUNCH_DAYS.map((day) => (
        <section className="lesson-panel" key={day.day}>
          <h2>
            Day {day.day}: {day.title}
          </h2>
          <ul className="check-list">
            {day.tasks.map((task) => {
              const id = `${day.day}-${task}`;
              const on = checked.includes(id);
              return (
                <li key={id}>
                  <label className={`check-item ${on ? "check-item--on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(id)}
                    />
                    <span>{task}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <div className="account-actions">
        <button className="btn btn--primary" type="button" onClick={save}>
          Save progress
        </button>
        {note && <p className="form-status">{note}</p>}
      </div>
    </div>
  );
}

function CeoScorecard({ userId }: { userId: string }) {
  const { draft, update, saveNow, savedNote } = useDraft(
    "ceo-scorecard",
    {
      ...defaultScorecard,
      weekOf: defaultScorecard.weekOf || new Date().toISOString().slice(0, 10),
    },
    userId,
  );

  return (
    <div className="tool-form">
      <label className="calc-field">
        <span>Week of</span>
        <input
          type="date"
          value={draft.weekOf}
          onChange={(e) => update("weekOf", e.target.value)}
        />
      </label>
      <label className="calc-field">
        <span>Revenue this week ($)</span>
        <input
          value={draft.revenue}
          onChange={(e) => update("revenue", e.target.value)}
        />
      </label>
      <label className="calc-field">
        <span>Outreach conversations</span>
        <input
          value={draft.outreach}
          onChange={(e) => update("outreach", e.target.value)}
        />
      </label>
      <label className="calc-field">
        <span>Content shipped</span>
        <input
          value={draft.content}
          onChange={(e) => update("content", e.target.value)}
        />
      </label>
      <label className="calc-field">
        <span>Energy (1–5)</span>
        <input
          type="number"
          min={1}
          max={5}
          value={draft.energy}
          onChange={(e) => update("energy", e.target.value)}
        />
      </label>
      <label className="calc-field">
        <span>Biggest win</span>
        <textarea
          rows={3}
          value={draft.win}
          onChange={(e) => update("win", e.target.value)}
        />
      </label>
      <label className="calc-field">
        <span>Next week focus</span>
        <textarea
          rows={3}
          value={draft.nextFocus}
          onChange={(e) => update("nextFocus", e.target.value)}
        />
      </label>
      <div className="account-actions">
        <button className="btn btn--primary" type="button" onClick={saveNow}>
          Save scorecard
        </button>
        {savedNote && <p className="form-status">{savedNote}</p>}
      </div>
    </div>
  );
}
