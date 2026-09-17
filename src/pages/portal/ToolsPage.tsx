import { Link, Navigate } from "react-router-dom";
import { TOOLS } from "../../data/tools";
import { useAuth } from "../../lib/auth";
import { isMember } from "../../lib/access";

export function ToolsPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;
  const member = isMember(user.plan);

  return (
    <div className="portal-page">
      <p className="eyebrow">Startup toolkit</p>
      <h1>
        Worksheets that move the <em>needle</em>
      </h1>
      <p className="portal-lede">
        Offer builder, ideal client, launch planner, and weekly CEO scorecard —
        saved on this device as you go.
      </p>

      <div className="module-grid">
        {TOOLS.map((tool) => {
          const locked = tool.membersOnly && !member;
          return (
            <Link
              key={tool.id}
              className={`module-card ${locked ? "module-card--locked" : ""}`}
              to={locked ? "/pricing" : `/portal/tools/${tool.id}`}
            >
              <p className="module-card__phase">{tool.badge}</p>
              <h3>{tool.title}</h3>
              <p>{tool.blurb}</p>
              <p className="module-card__meta">
                {locked ? "Members only" : "Open tool →"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
