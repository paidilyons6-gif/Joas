import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  allLessonsMerged,
  nextLessonMerged,
  usePublishedTracks,
} from "../../lib/courseCatalog";
import { useAuth } from "../../lib/auth";
import { hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import { coursesAreOpen, coursesOpenLabel } from "../../lib/coursesOpen";

export function PortalHome() {
  const { user, refresh } = useAuth();
  const { preview } = useClientPreview();
  const [params] = useSearchParams();
  const { tracks, loading } = usePublishedTracks();
  if (!user) return <Navigate to="/sign-in" replace />;

  const unlocked = hasAnyProgram(user.programs);
  const admin = isAdminEmail(user.email) && !preview;
  const lessons = allLessonsMerged();
  const done = user.completedLessons.filter((id) =>
    lessons.some((l) => l.id === id),
  ).length;
  const total = lessons.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const next = nextLessonMerged(user.completedLessons);
  const checkoutSuccess = params.get("checkout") === "success";
  const coursesLocked = unlocked && !admin && !coursesAreOpen();

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
          Your free account is ready — same idea as The Village. Buy a program
          to unlock courses, tools, and Business Meeting.
        </p>

        <div className="upgrade-banner">
          <div>
            <h2>Shop programs</h2>
            <p>
              Programs Becca publishes in Studio — pay once or subscribe, then
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
            <p>
              {coursesLocked
                ? "The Office platform is unlocked. Course training opens October 14th — use Toolkit, Calculators, and Business Meeting now."
                : "Your program is unlocked — dive into courses, tools, and The Office."}
            </p>
          </div>
          {coursesLocked ? (
            <Link className="btn btn--primary" to="/portal/courses">
              Courses info →
            </Link>
          ) : (
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => void refresh()}
            >
              Refresh access
            </button>
          )}
        </div>
      )}

      {coursesLocked && !checkoutSuccess && (
        <div className="upgrade-banner" role="status">
          <div>
            <h2>{coursesOpenLabel()}</h2>
            <p>
              Platform access is yours now. Seen. Heard. Earn. course training
              unlocks October 14th.
            </p>
          </div>
          <Link className="btn btn--primary" to="/portal/courses">
            View Courses →
          </Link>
        </div>
      )}

      <div className="portal-page__head-row">
        <div>
          <p className="eyebrow">Portal home</p>
          <h1>
            Welcome to <em>The Office</em>
          </h1>
          <p className="portal-lede">
            {coursesLocked
              ? "Your platform is open — Toolkit, Calculators, Vault, and Business Meeting. Courses open October 14th."
              : "Courses, calculators, toolkit, vault, and Business Meeting — ready to build."}
            {admin
              ? " Studio lets you edit programs, add lesson videos, and set prices."
              : ""}
          </p>
        </div>
        {admin && (
          <Link className="btn btn--primary" to="/portal/studio">
            Open Studio →
          </Link>
        )}
      </div>

      {loading && <p className="portal-lede">Loading your library…</p>}

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

      {next && !coursesLocked && (
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
          <h3>{coursesLocked ? coursesOpenLabel() : "Courses"}</h3>
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
          <h3>Business Meeting</h3>
        </Link>
        <Link className="pin-card" to="/programs">
          <p className="pin-card__label">Shop</p>
          <h3>More programs</h3>
        </Link>
      </div>
    </div>
  );
}
