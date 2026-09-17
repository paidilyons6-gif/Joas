import { Link, Navigate, useParams } from "react-router-dom";
import { getTrack, trackProgress } from "../../data/courses";
import { useAuth } from "../../lib/auth";
import { canAccessLesson, isMember } from "../../lib/access";

export function TrackPage() {
  const { trackId } = useParams();
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;

  const track = getTrack(trackId || "");
  if (!track) return <Navigate to="/portal/courses" replace />;

  const member = isMember(user.plan);
  if (track.membersOnly && !member) {
    return <Navigate to="/pricing" replace />;
  }

  const progress = trackProgress(track.id, user.completedLessons);

  return (
    <div className="portal-page">
      <Link className="back-link" to="/portal/courses">
        ← All courses
      </Link>
      <p className="eyebrow">{track.badge}</p>
      <h1>{track.title}</h1>
      <p className="portal-lede">{track.blurb}</p>
      <div className="progress-bar" aria-hidden="true">
        <span style={{ width: `${progress.pct}%` }} />
      </div>
      <p className="module-card__meta" style={{ marginBottom: "1.5rem" }}>
        {progress.done}/{progress.total} lessons complete
      </p>

      <div className="training-list">
        {track.lessons.map((lesson, index) => {
          const locked = !canAccessLesson(lesson.membersOnly, user.plan);
          const done = user.completedLessons.includes(lesson.id);
          return (
            <article key={lesson.id} className={`training-row ${done ? "training-row--done" : ""}`}>
              <div>
                <p className="module-card__phase">
                  Lesson {index + 1}
                  {done ? " · Done" : ""}
                </p>
                <h2>{lesson.title}</h2>
                <p>
                  {lesson.duration} min · {lesson.objectives.length} objectives
                  {locked ? " · Members only" : ""}
                </p>
              </div>
              {locked ? (
                <Link className="btn btn--primary" to="/pricing">
                  Unlock →
                </Link>
              ) : (
                <Link
                  className="btn btn--ink"
                  to={`/portal/courses/${track.id}/${lesson.id}`}
                >
                  {done ? "Review →" : "Start →"}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
