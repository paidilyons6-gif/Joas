import { Link, Navigate } from "react-router-dom";
import {
  trackProgressFromTrack,
  usePublishedTracks,
} from "../../lib/courseCatalog";
import { useAuth } from "../../lib/auth";
import { hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";

export function CoursesPage() {
  const { user } = useAuth();
  const { preview } = useClientPreview();
  const { tracks, loading } = usePublishedTracks();
  if (!user) return <Navigate to="/sign-in" replace />;
  const member = hasAnyProgram(user.programs);
  const admin = isAdminEmail(user.email) && !preview;

  return (
    <div className="portal-page">
      <div className="portal-page__head-row">
        <div>
          <p className="eyebrow">Courses</p>
          <h1>
            Train like you mean <em>business</em>
          </h1>
          <p className="portal-lede">
            Follow the courses Becca builds in Studio — with video on each part
            when she adds it.
          </p>
        </div>
        {admin && (
          <Link className="btn btn--primary" to="/portal/studio">
            Create course →
          </Link>
        )}
      </div>

      {loading && <p className="portal-lede">Loading courses…</p>}
      {!loading && tracks.length === 0 && (
        <div className="studio-empty">
          <h3>No courses yet</h3>
          <p>
            {admin
              ? "Create and publish a course in Studio — members will follow that."
              : "Becca is adding your program courses. Check back soon."}
          </p>
          {admin && (
            <Link className="btn btn--primary" to="/portal/studio">
              Open Studio →
            </Link>
          )}
        </div>
      )}

      <div className="module-grid module-grid--desktop">
        {tracks.map((track) => {
          const progress = trackProgressFromTrack(track, user.completedLessons);
          const locked = track.membersOnly && !member && !admin;
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
