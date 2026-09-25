import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  allLessonsMerged,
  getAllTracks,
  nextLessonMerged,
} from "../../lib/courseCatalog";
import { useAuth } from "../../lib/auth";
import { hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";

export function PortalHome() {
  const { user, refresh } = useAuth();
  const [params] = useSearchParams();
  if (!user) return <Navigate to="/sign-in" replace />;

  const unlocked = hasAnyProgram(user.programs);
  const admin = isAdminEmail(user.email);
  const lessons = allLessonsMerged();
  const done = user.completedLessons.filter((id) =>
    lessons.some((l) => l.id === id),
  ).length;
  const total = lessons.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const next = nextLessonMerged(user.completedLessons);
  const tracks = getAllTracks();
  const checkoutSuccess = params.get("checkout") === "success";

  if (!unlocked && !admin) {
    return (
      <div className="portal-page">
        {checkoutSuccess && (
          <div className="upgrade-banner" role="status">
            <div>
              <h2>Thanks for your purchase ♡</h2>
              <p>If your program isn&apos;t open yet, tap refresh.</p>
            </div>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => void refresh()}
            >
              Refresh access
            </button>
          </div>
        )}

        <p className="eyebrow">Your account</p>
        <h1>
          Welcome to <em>The Office</em>
        </h1>
        <p className="portal-lede">
          Your free account is ready. Pick a program to unlock courses, tools,
          and community inside The Office.
        </p>

        <div className="upgrade-banner">
          <div>
            <h2>Shop programs</h2>
            <p>
              Programs Becky publishes in Studio — pay once or subscribe, then
              train here.
            </p>
          </div>
          <Link className="btn btn--primary" to="/programs">
            Browse programs →
          </Link>
        </div>

        <div className="account-actions" style={{ marginTop: "1.5rem" }}>
          <Link className="btn btn--ghost-ink" to="/portal/account">
            Account settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      {checkoutSuccess && (
        <div className="upgrade-banner" role="status">
          <div>
            <h2>You&apos;re in ♡</h2>
            <p>Your program is unlocked — dive into courses, tools, and The Office.</p>
          </div>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => void refresh()}
          >
            Refresh access
          </button>
        </div>
      )}

      <div className="portal-page__head-row">
        <div>
          <p className="eyebrow">Portal home</p>
          <h1>
            Welcome to <em>The Office</em>
          </h1>
          <p className="portal-lede">
            Courses, calculators, toolkit, vault, and community — ready to build.
            {admin ? " Studio lets you create & price programs." : ""}
          </p>
        </div>
        {admin && (
          <Link className="btn btn--primary" to="/portal/studio">
            Open Studio →
          </Link>
        )}
      </div>

      <div className="stat-row stat-row--3">
        <div className="stat">
          <p className="stat__label">Progress</p>
          <p className="stat__value">{pct}%</p>
          <p className="stat__meta">
            {done}/{total} lessons
          </p>
        </div>
        <div className="stat">
          <p className="stat__label">Courses</p>
          <p className="stat__value">{tracks.length}</p>
          <p className="stat__meta">In your library</p>
        </div>
        <div className="stat">
          <p className="stat__label">Programs</p>
          <p className="stat__value">{user.programs.length || "—"}</p>
          <p className="stat__meta">
            {user.programs.length ? user.programs.join(", ") : "Unlocked"}
          </p>
        </div>
      </div>

      {next && (
        <div className="upgrade-banner">
          <div>
            <h2>Continue: {next.lesson.title}</h2>
            <p>{next.track.title}</p>
          </div>
          <Link
            className="btn btn--primary"
            to={`/portal/courses/${next.track.id}/${next.lesson.id}`}
          >
            Resume →
          </Link>
        </div>
      )}

      <div className="pin-grid">
        <Link className="pin-card" to="/portal/courses">
          <p className="pin-card__label">Learn</p>
          <h3>Courses</h3>
        </Link>
        <Link className="pin-card" to="/portal/tools">
          <p className="pin-card__label">Build</p>
          <h3>Toolkit</h3>
        </Link>
        <Link className="pin-card" to="/portal/calculators">
          <p className="pin-card__label">Build</p>
          <h3>Calculators</h3>
        </Link>
        <Link className="pin-card" to="/portal/office">
          <p className="pin-card__label">Community</p>
          <h3>The Office</h3>
        </Link>
        <Link className="pin-card" to="/programs">
          <p className="pin-card__label">Shop</p>
          <h3>More programs</h3>
        </Link>
      </div>
    </div>
  );
}
