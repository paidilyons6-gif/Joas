import { Link, Navigate } from "react-router-dom";
import { COURSE_TRACKS, trackProgress } from "../../data/courses";
import { useAuth } from "../../lib/auth";
import { isMember } from "../../lib/access";

export function CoursesPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;
  const member = isMember(user.plan);

  return (
    <div className="portal-page">
      <p className="eyebrow">Courses</p>
      <h1>
        Train like you mean <em>business</em>
      </h1>
      <p className="portal-lede">
        Three elite tracks — startup foundations, money &amp; margins, and
        launch &amp; sales.
      </p>

      <div className="module-grid">
        {COURSE_TRACKS.map((track) => {
          const progress = trackProgress(track.id, user.completedLessons);
          const locked = track.membersOnly && !member;
          const minutes = track.lessons.reduce((sum, l) => sum + l.duration, 0);
          return (
            <article
              key={track.id}
              className={`module-card module-card--tall ${locked ? "module-card--locked" : ""}`}
            >
              <p className="module-card__phase">{track.badge}</p>
              <h3>{track.title}</h3>
              <p>{track.blurb}</p>
              <p className="module-card__meta">
                {track.lessons.length} lessons · ~{minutes} min
              </p>
              <div className="progress-bar" aria-hidden="true">
                <span style={{ width: `${progress.pct}%` }} />
              </div>
              <p className="module-card__meta">
                {progress.pct}% complete
              </p>
              {locked ? (
                <Link className="btn btn--primary" to="/pricing">
                  Unlock track →
                </Link>
              ) : (
                <Link className="btn btn--ink" to={`/portal/courses/${track.id}`}>
                  Open track →
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
