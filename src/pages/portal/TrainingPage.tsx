import { Link, Navigate } from "react-router-dom";
import { CURRICULUM } from "../../data/content";
import { useAuth } from "../../lib/auth";

export function TrainingPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;
  const member = user.plan !== "none";

  return (
    <div className="portal-page">
      <p className="eyebrow">Training</p>
      <h1>
        Build with a <em>clear path</em>
      </h1>
      <p className="portal-lede">
        Four phases. Practical lessons. Check them off as you go.
      </p>

      <div className="training-list">
        {CURRICULUM.map((mod) => {
          const locked = mod.membersOnly && !member;
          return (
            <article key={mod.id} className="training-row">
              <div>
                <p className="module-card__phase">{mod.phase}</p>
                <h2>{mod.title}</h2>
                <p>{mod.blurb}</p>
              </div>
              {locked ? (
                <Link className="btn btn--primary" to="/pricing">
                  Unlock →
                </Link>
              ) : (
                <Link className="btn btn--ink" to={`/portal/training/${mod.id}`}>
                  Open module →
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
