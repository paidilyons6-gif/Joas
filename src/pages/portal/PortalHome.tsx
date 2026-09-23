import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  allLessonsMerged,
  getAllTracks,
  nextLessonMerged,
  trackProgressFromTrack,
} from "../../lib/courseCatalog";
import { CALCULATORS } from "../../data/calculators";
import { TOOLS } from "../../data/tools";
import { useAuth } from "../../lib/auth";
import { isMember } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";

export function PortalHome() {
  const { user, refresh } = useAuth();
  const [params] = useSearchParams();
  if (!user) return <Navigate to="/sign-in" replace />;

  const member = isMember(user.plan);
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

  if (!member && !admin) {
    return (
      <div className="portal-page">
        {checkoutSuccess && (
          <div className="upgrade-banner" role="status">
            <div>
              <h2>Thanks for subscribing ♡</h2>
              <p>If access isn&apos;t open yet, refresh after your app subscription syncs.</p>
            </div>
            <button className="btn btn--primary" type="button" onClick={() => void refresh()}>
              Refresh access
            </button>
          </div>
        )}

        <p className="eyebrow">Your account</p>
        <h1>
          You&apos;re in — get <em>BodiesByBecca</em>
        </h1>
        <p className="portal-lede">
          Free accounts can sign up anytime. Courses, calculators, toolkit, vault,
          and The Office unlock with BodiesByBecca membership (App Store / Play).
        </p>

        <div className="upgrade-banner">
          <div>
            <h2>Unlock with BodiesByBecca</h2>
            <p>Subscribe in the app after challenges end in October — then open The Office here.</p>
          </div>
          <Link className="btn btn--primary" to="/pricing">
            Membership →
          </Link>
        </div>

        <div className="stat-row stat-row--3">
          <div className="stat">
            <p className="stat__label">Courses</p>
            <p className="stat__value">{tracks.length}</p>
            <p className="stat__meta">BodiesByBecca membership</p>
          </div>
          <div className="stat">
            <p className="stat__label">Access</p>
            <p className="stat__value">Free</p>
            <p className="stat__meta">Subscribe in the app to open everything</p>
          </div>
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
            <p>BodiesByBecca membership is active — dive into courses, tools, and The Office.</p>
          </div>
          <button className="btn btn--primary" type="button" onClick={() => void refresh()}>
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
            {admin ? " Studio lets you edit every program." : ""}
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
          <p className="stat__label">Course progress</p>
          <p className="stat__value">{pct}%</p>
          <p className="stat__meta">
            {done} of {total} lessons
          </p>
          <div className="progress-bar" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="stat">
          <p className="stat__label">Access</p>
          <p className="stat__value">Member</p>
          <p className="stat__meta">Full Office unlocked</p>
        </div>
        <div className="stat">
          <p className="stat__label">Tools ready</p>
          <p className="stat__value">{CALCULATORS.length + TOOLS.length}</p>
          <p className="stat__meta">Calculators + worksheets</p>
        </div>
      </div>

      {next && (
        <div className="continue-card">
          <div>
            <p className="eyebrow">Continue where you left off</p>
            <h2>{next.lesson.title}</h2>
            <p>
              {next.track.title} · {next.lesson.duration} min
            </p>
          </div>
          <Link
            className="btn btn--primary"
            to={`/portal/courses/${next.track.id}/${next.lesson.id}`}
          >
            Resume lesson →
          </Link>
        </div>
      )}

      <h2 className="portal-subhead">Course tracks</h2>
      <div className="module-grid module-grid--desktop">
        {tracks.map((track) => {
          const progress = trackProgressFromTrack(track, user.completedLessons);
          return (
            <Link
              key={track.id}
              className="module-card"
              to={`/portal/courses/${track.id}`}
            >
              <p className="module-card__phase">{track.badge}</p>
              <h3>{track.title}</h3>
              <p>{track.blurb}</p>
              <div className="progress-bar progress-bar--sm" aria-hidden="true">
                <span style={{ width: `${progress.pct}%` }} />
              </div>
              <p className="module-card__meta">
                {progress.done}/{progress.total} lessons · {progress.pct}%
              </p>
            </Link>
          );
        })}
      </div>

      <h2 className="portal-subhead">Pinned tools</h2>
      <div className="pin-grid">
        <Link className="pin-card" to="/portal/calculators/pricing">
          <p className="module-card__phase">Calculator</p>
          <h3>Pricing power</h3>
          <p>Set a price with margin math.</p>
        </Link>
        <Link className="pin-card" to="/portal/calculators/breakeven">
          <p className="module-card__phase">Calculator</p>
          <h3>Break-even</h3>
          <p>Know your number to cover costs.</p>
        </Link>
        <Link className="pin-card" to="/portal/tools/offer-builder">
          <p className="module-card__phase">Toolkit</p>
          <h3>Offer builder</h3>
          <p>Draft who, promise, and price.</p>
        </Link>
        <Link className="pin-card" to="/portal/tools/ceo-scorecard">
          <p className="module-card__phase">Toolkit</p>
          <h3>CEO scorecard</h3>
          <p>Weekly check-in for founders.</p>
        </Link>
      </div>
    </div>
  );
}
