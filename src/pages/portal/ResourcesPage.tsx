import { Link, Navigate } from "react-router-dom";
import { RESOURCES } from "../../data/content";
import { useAuth } from "../../lib/auth";

export function ResourcesPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;
  const member = user.plan !== "none";

  return (
    <div className="portal-page">
      <p className="eyebrow">Resource vault</p>
      <h1>
        Tools you can use <em>tonight</em>
      </h1>
      <p className="portal-lede">
        Templates and scripts to cut the overwhelm and ship faster.
      </p>

      {!member && (
        <div className="upgrade-banner">
          <div>
            <h2>Resources unlock with membership</h2>
            <p>Preview the vault below — full downloads come with your plan.</p>
          </div>
          <Link className="btn btn--primary" to="/pricing">
            Upgrade →
          </Link>
        </div>
      )}

      <div className="module-grid">
        {RESOURCES.map((resource) => (
          <div
            key={resource.id}
            className={`module-card ${member ? "" : "module-card--locked"}`}
          >
            <p className="module-card__phase">{resource.type}</p>
            <h3>{resource.title}</h3>
            <p>{resource.blurb}</p>
            <p className="module-card__meta">
              {member ? "Ready in your vault" : "Members only"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
