import { Link, Navigate } from "react-router-dom";
import { CURRICULUM } from "../../data/content";
import { useAuth } from "../../lib/auth";

export function PortalHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;

  const member = user.plan !== "none";
  const totalLessons = CURRICULUM.flatMap((m) => m.lessons).length;
  const done = user.completedLessons.length;
  const pct = Math.round((done / totalLessons) * 100);

  return (
    <div className="portal-page">
      <p className="eyebrow">Portal home</p>
      <h1>
        Same girl, <em>bigger plans</em>
      </h1>
      <p className="portal-lede">
        Your training hub for offers, launches, and freedom-focused growth.
      </p>

      <div className="stat-row">
        <div className="stat">
          <p className="stat__label">Progress</p>
          <p className="stat__value">{pct}%</p>
          <p className="stat__meta">
            {done} of {totalLessons} lessons
          </p>
        </div>
        <div className="stat">
          <p className="stat__label">Access</p>
          <p className="stat__value">{member ? "Member" : "Free"}</p>
          <p className="stat__meta">
            {member ? "Full curriculum unlocked" : "Upgrade to unlock phases 2–4"}
          </p>
        </div>
      </div>

      {!member && (
        <div className="upgrade-banner">
          <div>
            <h2>Ready to unlock the full portal?</h2>
            <p>Monthly membership or Founders Year — pick what fits your season.</p>
          </div>
          <Link className="btn btn--primary" to="/pricing">
            View pricing →
          </Link>
        </div>
      )}

      <h2 className="portal-subhead">Continue training</h2>
      <div className="module-grid">
        {CURRICULUM.map((mod) => {
          const locked = mod.membersOnly && !member;
          const completed = mod.lessons.filter((l) =>
            user.completedLessons.includes(l.id),
          ).length;
          return (
            <Link
              key={mod.id}
              className={`module-card ${locked ? "module-card--locked" : ""}`}
              to={locked ? "/pricing" : `/portal/training/${mod.id}`}
            >
              <p className="module-card__phase">{mod.phase}</p>
              <h3>{mod.title}</h3>
              <p>{mod.blurb}</p>
              <p className="module-card__meta">
                {locked
                  ? "Members only"
                  : `${completed}/${mod.lessons.length} lessons · ${mod.minutes} min`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
