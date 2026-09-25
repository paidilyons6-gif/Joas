import { Link, Navigate } from "react-router-dom";
import { getAllTracks, trackProgressFromTrack } from "../../lib/courseCatalog";
import { useAuth } from "../../lib/auth";
import { hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";

export function CoursesPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;
  const member = hasAnyProgram(user.programs);
  const admin = isAdminEmail(user.email);
  const tracks = getAllTracks({ includeDrafts: false });

  return (
    <div className="portal-page">
      <div className="portal-page__head-row">
        <div>
          <p className="eyebrow">Courses</p>
          <h1>
            Train like you mean <em>business</em>
          </h1>
          <p className="portal-lede">
            Learning paths — startup, money, launch, plus any
            courses Becca publishes in Studio.
          </p>
        </div>
        {admin && (
          <Link className="btn btn--primary" to="/portal/studio">
            Create course →
          </Link>
        )}
      </div>

      <div className="module-grid module-grid--desktop">
        {tracks.map((track) => {
          const progress = trackProgressFromTrack(track, user.completedLessons);
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
              <p className="module-card__meta">{progress.pct}% complete</p>
              {locked ? (
                <Link className="btn btn--primary" to="/programs">
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
