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

  const checklist = [
    {
      id: "lesson",
      label: "Complete your first free lesson",
      done: done > 0,
      to: "/portal/courses/startup/startup-1",
    },
    {
      id: "calc",
      label: "Run the Pricing Power calculator",
      done: false,
      to: "/portal/calculators/pricing",
    },
    {
      id: "upgrade",
      label: "Unlock membership when ready",
      done: member,
      to: "/pricing",
    },
  ];

  return (
    <div className="portal-page">
      {checkoutSuccess && (
        <div className="upgrade-banner" role="status">
          <div>
            <h2>You&apos;re in ♡</h2>
            <p>
              {member
                ? "Membership is active — dive into Money, Launch, and the full toolkit."
                : "If you just paid, refresh in a moment while Stripe confirms."}
            </p>
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

      <section className="onboarding-card">
        <h2>Start here</h2>
        <ul className="check-list">
          {checklist.map((item) => (
            <li key={item.id}>
              <Link
                className={`check-item ${item.done ? "check-item--on" : ""}`}
                to={item.to}
              >
                <span aria-hidden="true">{item.done ? "✓" : "○"}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
          <p className="stat__value">{member ? "Member" : "Free"}</p>
          <p className="stat__meta">
            {member ? "Membership active" : "Upgrade for Money + Launch tracks"}
          </p>
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

      {!member && (
        <div className="upgrade-banner">
          <div>
            <h2>Unlock the elite portal</h2>
            <p>
              Money &amp; Margins, Launch &amp; Sales, full calculators, and the
              startup toolkit.
            </p>
          </div>
          <Link className="btn btn--primary" to="/pricing">
            View pricing →
          </Link>
        </div>
      )}

      <h2 className="portal-subhead">Course tracks</h2>
      <div className="module-grid module-grid--desktop">
        {tracks.map((track) => {
          const progress = trackProgressFromTrack(track, user.completedLessons);
          const locked = track.membersOnly && !member;
          return (
            <Link
              key={track.id}
              className={`module-card ${locked ? "module-card--locked" : ""}`}
              to={locked ? "/pricing" : `/portal/courses/${track.id}`}
            >
              <p className="module-card__phase">{track.badge}</p>
              <h3>{track.title}</h3>
              <p>{track.blurb}</p>
              <div className="progress-bar progress-bar--sm" aria-hidden="true">
                <span style={{ width: `${progress.pct}%` }} />
              </div>
              <p className="module-card__meta">
                {locked
                  ? "Members only"
                  : `${progress.done}/${progress.total} lessons · ${progress.pct}%`}
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
        <Link
          className="pin-card"
          to={member ? "/portal/calculators/breakeven" : "/pricing"}
        >
          <p className="module-card__phase">Calculator</p>
          <h3>Break-even</h3>
          <p>Know your number to cover costs.</p>
        </Link>
        <Link
          className="pin-card"
          to={member ? "/portal/tools/offer-builder" : "/pricing"}
        >
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
