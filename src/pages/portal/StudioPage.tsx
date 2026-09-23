import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { isAdminEmail } from "../../lib/admin";
import {
  emptyLesson,
  emptyTrack,
  studioStore,
  type StudioLesson,
  type StudioTrack,
} from "../../lib/studio";

export function StudioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!isAdminEmail(user.email)) return <Navigate to="/portal" replace />;

  const [tracks, setTracks] = useState<StudioTrack[]>([]);

  useEffect(() => {
    setTracks(studioStore.list());
  }, []);

  function createCourse() {
    const track = emptyTrack();
    studioStore.upsertTrack(track);
    setTracks(studioStore.list());
    navigate(`/portal/studio/${track.id}`);
  }

  function remove(id: string) {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    studioStore.deleteTrack(id);
    setTracks(studioStore.list());
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Studio</p>
      <h1>
        Create your <em>learning portal</em>
      </h1>
      <p className="portal-lede">
        Build Village-style courses for Business by Becca — modules, lessons,
        worksheets, and publish when ready. Optimized for laptop creation.
      </p>

      <div className="studio-hero">
        <div>
          <h2>Your course library</h2>
          <p>
            Members see published courses in Courses. Drafts stay private until
            you hit publish.
          </p>
        </div>
        <button className="btn btn--primary" type="button" onClick={createCourse}>
          + New course
        </button>
      </div>

      {tracks.length === 0 ? (
        <div className="studio-empty">
          <h3>No custom courses yet</h3>
          <p>
            Start your first learning path — offers, money, launch, or anything
            your village needs.
          </p>
          <button className="btn btn--ink" type="button" onClick={createCourse}>
            Create first course →
          </button>
        </div>
      ) : (
        <div className="module-grid">
          {tracks.map((track) => (
            <article key={track.id} className="module-card module-card--tall">
              <p className="module-card__phase">
                {track.published ? "Published" : "Draft"}
              </p>
              <h3>{track.title}</h3>
              <p>{track.blurb}</p>
              <p className="module-card__meta">
                {track.lessons.length} lessons ·{" "}
                {track.membersOnly ? "Members only" : "Free access"}
              </p>
              <div className="account-actions">
                <Link className="btn btn--ink" to={`/portal/studio/${track.id}`}>
                  Edit →
                </Link>
                <button
                  className="btn btn--ghost-ink"
                  type="button"
                  onClick={() => remove(track.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudioEditorPage() {
  const { trackId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!isAdminEmail(user.email)) return <Navigate to="/portal" replace />;

  const existing = trackId ? studioStore.getTrack(trackId) : null;
  const [track, setTrack] = useState<StudioTrack | null>(existing);
  const [activeLesson, setActiveLesson] = useState(0);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!existing) navigate("/portal/studio");
  }, [existing, navigate]);

  if (!track) return null;

  const current = track;
  const lesson = current.lessons[activeLesson] || current.lessons[0];

  function updateTrack(patch: Partial<StudioTrack>) {
    setTrack((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateLesson(patch: Partial<StudioLesson>) {
    setTrack((prev) => {
      if (!prev) return prev;
      const lessons = prev.lessons.map((l, i) =>
        i === activeLesson ? { ...l, ...patch } : l,
      );
      return { ...prev, lessons };
    });
  }

  function updateSection(index: number, patch: { heading?: string; body?: string }) {
    if (!lesson) return;
    const sections = lesson.sections.map((s, i) =>
      i === index ? { ...s, ...patch } : s,
    );
    updateLesson({ sections });
  }

  function addLesson() {
    const id = `${current.id}-l${current.lessons.length + 1}-${crypto.randomUUID().slice(0, 4)}`;
    const next = [...current.lessons, emptyLesson(id)];
    updateTrack({ lessons: next });
    setActiveLesson(next.length - 1);
  }

  function addSection() {
    if (!lesson) return;
    updateLesson({
      sections: [
        ...lesson.sections,
        { heading: "New section", body: "Write content…" },
      ],
    });
  }

  function onSave(event: FormEvent) {
    event.preventDefault();
    studioStore.upsertTrack(current);
    setSaved(current.published ? "Published to the portal ♡" : "Draft saved ♡");
    window.setTimeout(() => setSaved(""), 2200);
  }

  function publishToggle() {
    const next: StudioTrack = {
      ...current,
      published: !current.published,
      badge: !current.published ? "Village course" : "Draft",
    };
    setTrack(next);
    studioStore.upsertTrack(next);
    setSaved(next.published ? "Live in Courses ♡" : "Unpublished — draft only");
    window.setTimeout(() => setSaved(""), 2200);
  }

  return (
    <div className="portal-page studio-editor">
      <Link className="back-link" to="/portal/studio">
        ← Studio
      </Link>
      <div className="studio-editor__head">
        <div>
          <p className="eyebrow">Course editor</p>
          <h1>
            Build on <em>laptop</em>
          </h1>
        </div>
        <div className="account-actions">
          <button className="btn btn--ghost-ink" type="button" onClick={publishToggle}>
            {current.published ? "Unpublish" : "Publish course"}
          </button>
          <button className="btn btn--primary" type="button" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
      {saved && <p className="form-status">{saved}</p>}

      <form className="studio-layout" onSubmit={onSave}>
        <aside className="studio-sidebar">
          <label className="calc-field">
            <span>Course title</span>
            <input
              value={current.title}
              onChange={(e) => updateTrack({ title: e.target.value })}
              required
            />
          </label>
          <label className="calc-field">
            <span>Short description</span>
            <textarea
              rows={3}
              value={current.blurb}
              onChange={(e) => updateTrack({ blurb: e.target.value })}
            />
          </label>
          <label className="check-item">
            <input
              type="checkbox"
              checked={current.membersOnly}
              onChange={(e) => updateTrack({ membersOnly: e.target.checked })}
            />
            <span>Members only</span>
          </label>

          <p className="portal-subhead">Lessons</p>
          <div className="studio-lesson-list">
            {current.lessons.map((l, i) => (
              <button
                key={l.id}
                type="button"
                className={`studio-lesson-tab ${i === activeLesson ? "is-active" : ""}`}
                onClick={() => setActiveLesson(i)}
              >
                {i + 1}. {l.title || "Untitled"}
              </button>
            ))}
          </div>
          <button className="btn btn--ink" type="button" onClick={addLesson}>
            + Add lesson
          </button>
        </aside>

        {lesson && (
          <div className="studio-canvas">
            <label className="calc-field">
              <span>Lesson title</span>
              <input
                value={lesson.title}
                onChange={(e) => updateLesson({ title: e.target.value })}
              />
            </label>
            <label className="calc-field">
              <span>Duration (minutes)</span>
              <input
                type="number"
                min={1}
                value={lesson.duration}
                onChange={(e) =>
                  updateLesson({ duration: Number(e.target.value) || 1 })
                }
              />
            </label>
            <label className="calc-field">
              <span>Objectives (one per line)</span>
              <textarea
                rows={3}
                value={lesson.objectives.join("\n")}
                onChange={(e) =>
                  updateLesson({
                    objectives: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>

            {lesson.sections.map((section, index) => (
              <div className="lesson-panel" key={`${lesson.id}-s${index}`}>
                <label className="calc-field">
                  <span>Section heading</span>
                  <input
                    value={section.heading}
                    onChange={(e) =>
                      updateSection(index, { heading: e.target.value })
                    }
                  />
                </label>
                <label className="calc-field">
                  <span>Section body</span>
                  <textarea
                    rows={5}
                    value={section.body}
                    onChange={(e) =>
                      updateSection(index, { body: e.target.value })
                    }
                  />
                </label>
              </div>
            ))}
            <button className="btn btn--ghost-ink" type="button" onClick={addSection}>
              + Add section
            </button>

            <label className="calc-field">
              <span>Do this now</span>
              <textarea
                rows={2}
                value={lesson.action}
                onChange={(e) => updateLesson({ action: e.target.value })}
              />
            </label>
            <label className="calc-field">
              <span>Worksheet prompt</span>
              <textarea
                rows={2}
                value={lesson.worksheetPrompt}
                onChange={(e) =>
                  updateLesson({ worksheetPrompt: e.target.value })
                }
              />
            </label>
          </div>
        )}
      </form>
    </div>
  );
}
