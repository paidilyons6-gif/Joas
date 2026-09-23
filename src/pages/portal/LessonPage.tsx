import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getMergedTrack } from "../../lib/courseCatalog";
import { useAuth } from "../../lib/auth";
import { canAccessLesson } from "../../lib/access";
import { loadDrafts, saveLessonNote } from "../../lib/draftsRepo";

export function LessonPage() {
  const { trackId, lessonId } = useParams();
  const { user, toggleLesson } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;

  const track = getMergedTrack(trackId || "");
  const lesson = track?.lessons.find((l) => l.id === lessonId);
  if (!track || !lesson) return <Navigate to="/portal/courses" replace />;

  if (!canAccessLesson(lesson.membersOnly, user.plan)) {
    return <Navigate to="/pricing" replace />;
  }

  const done = user.completedLessons.includes(lesson.id);
  const idx = track.lessons.findIndex((l) => l.id === lesson.id);
  const prev = track.lessons[idx - 1];
  const next = track.lessons[idx + 1];
  const lessonKey = lesson.id;

  const [notes, setNotes] = useState("");
  const [noteStatus, setNoteStatus] = useState("");

  useEffect(() => {
    void loadDrafts(user.id).then((d) => {
      setNotes(d.lessonNotes[lessonKey] || "");
    });
  }, [user.id, lessonKey]);

  async function persistNotes() {
    if (!user) return;
    await saveLessonNote(user.id, lessonKey, notes);
    setNoteStatus("Notes saved ♡");
    window.setTimeout(() => setNoteStatus(""), 2000);
  }

  return (
    <div className="portal-page lesson-player lesson-player--desktop">
      <Link className="back-link" to={`/portal/courses/${track.id}`}>
        ← {track.title}
      </Link>
      <p className="eyebrow">
        Lesson {idx + 1} · {lesson.duration} min
      </p>
      <h1>{lesson.title}</h1>

      <div className="lesson-desktop-grid">
        <div>
          <section className="lesson-panel">
            <h2>Objectives</h2>
            <ul className="objective-list">
              {lesson.objectives.map((obj) => (
                <li key={obj}>{obj}</li>
              ))}
            </ul>
          </section>

          {lesson.sections.map((section) => (
            <section className="lesson-panel" key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}

          <section className="lesson-panel">
            <h2>Your notes</h2>
            <label className="calc-field">
              <span className="visually-hidden">Lesson notes</span>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Capture ideas, decisions, and follow-ups…"
              />
            </label>
            <div className="account-actions">
              <button
                className="btn btn--ghost-ink"
                type="button"
                onClick={() => void persistNotes()}
              >
                Save notes
              </button>
              {noteStatus && <p className="form-status">{noteStatus}</p>}
            </div>
          </section>
        </div>

        <aside className="lesson-rail">
          <section className="lesson-panel lesson-panel--action">
            <h2>Do this now</h2>
            <p>{lesson.action}</p>
          </section>
          <section className="lesson-panel">
            <h2>Worksheet prompt</h2>
            <p className="worksheet-prompt">{lesson.worksheetPrompt}</p>
          </section>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => void toggleLesson(lesson.id)}
          >
            {done ? "Completed ♡ (undo)" : "Mark complete →"}
          </button>
          <div className="lesson-nav">
            {prev ? (
              <Link
                className="btn btn--ghost-ink"
                to={`/portal/courses/${track.id}/${prev.id}`}
              >
                ← Prev
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                className="btn btn--ink"
                to={`/portal/courses/${track.id}/${next.id}`}
              >
                Next →
              </Link>
            ) : (
              <Link className="btn btn--ink" to={`/portal/courses/${track.id}`}>
                Track →
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
