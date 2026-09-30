import { Link, Navigate } from "react-router-dom";
import { TOOLS } from "../../data/tools";
import { useAuth } from "../../lib/auth";
import { canAccessContent, hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";

export function ToolsPage() {
  const { user } = useAuth();
  const { preview, setPreview } = useClientPreview();
  if (!user) return <Navigate to="/sign-in" replace />;
  const isAdmin = isAdminEmail(user.email);
  const unlocked = canAccessContent(user.programs, {
    isAdmin: isAdmin && !preview,
  });
  const ownsProgram = hasAnyProgram(user.programs);

  return (
    <div className="portal-page">
      <p className="eyebrow">Startup toolkit</p>
      <h1>
        Worksheets that move the <em>needle</em>
      </h1>
      <p className="portal-lede">
        Offer builder, ideal client, launch planner, and weekly CEO scorecard —
        unlocked when you buy a program (a free signup alone is not enough).
      </p>

      {isAdmin && preview && (
        <div className="upgrade-banner" role="status">
          <div>
            <h2>Client view is on</h2>
            <p>
              This is the locked buyer experience. Switch to Coach view to edit
              and unlock as admin.
            </p>
          </div>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setPreview(false)}
          >
            Coach view →
          </button>
        </div>
      )}

      {!unlocked && !preview && (
        <div className="upgrade-banner">
          <div>
            <h2>Toolkit needs a program</h2>
            <p>
              {ownsProgram
                ? "Refresh your access if you just purchased."
                : "Signed up is free — buy a program to open these worksheets."}
            </p>
          </div>
          <Link className="btn btn--primary" to="/programs">
            Shop programs →
          </Link>
        </div>
      )}

      <div className="module-grid">
        {TOOLS.map((tool) => {
          const locked = tool.membersOnly && !unlocked;
          return (
            <Link
              key={tool.id}
              className={`module-card ${locked ? "module-card--locked" : ""}`}
              to={locked ? "/programs" : `/portal/tools/${tool.id}`}
            >
              <p className="module-card__phase">{tool.badge}</p>
              <h3>{tool.title}</h3>
              <p>{tool.blurb}</p>
              <p className="module-card__meta">
                {locked ? "Buy a program to unlock" : "Open tool →"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
