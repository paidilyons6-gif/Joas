import { Link, Navigate, useParams } from "react-router-dom";
import { CURRICULUM } from "../../data/content";
import { useAuth } from "../../lib/auth";

export function ModulePage() {
  const { moduleId } = useParams();
  const { user, toggleLesson } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;

  const mod = CURRICULUM.find((m) => m.id === moduleId);
  if (!mod) return <Navigate to="/portal/training" replace />;

  const member = user.plan !== "none";
  if (mod.membersOnly && !member) {
    return <Navigate to="/pricing" replace />;
  }

  return (
    <div className="portal-page">
      <Link className="back-link" to="/portal/training">
        ← All training
      </Link>
      <p className="eyebrow">{mod.phase}</p>
      <h1>{mod.title}</h1>
      <p className="portal-lede">{mod.blurb}</p>

      <div className="lesson-list">
        {mod.lessons.map((lesson, index) => {
          const done = user.completedLessons.includes(lesson.id);
          return (
            <article key={lesson.id} className={`lesson ${done ? "lesson--done" : ""}`}>
              <div className="lesson__top">
                <h2>
                  <span>0{index + 1}</span> {lesson.title}
                </h2>
                <button
                  className="btn btn--ghost-ink"
                  type="button"
                  onClick={() => void toggleLesson(lesson.id)}
                >
                  {done ? "Completed ♡" : "Mark complete"}
                </button>
              </div>
              <p>{lesson.body}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
