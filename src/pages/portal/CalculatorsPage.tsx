import { Link, Navigate } from "react-router-dom";
import { CALCULATORS } from "../../data/calculators";
import { useAuth } from "../../lib/auth";
import { canAccessContent, hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";

export function CalculatorsPage() {
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
      <p className="eyebrow">Financial suite</p>
      <h1>
        Calculators that create <em>clarity</em>
      </h1>
      <p className="portal-lede">
        Price, break-even, goals, runway, profit, and offer mix — unlocked when
        you buy a program.
      </p>

      {isAdmin && preview && (
        <div className="upgrade-banner" role="status">
          <div>
            <h2>Client view is on</h2>
            <p>Switch to Coach view to use calculators as admin.</p>
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
            <h2>Calculators need a program</h2>
            <p>
              {ownsProgram
                ? "Refresh your access if you just purchased."
                : "A free account isn’t enough — buy a program to unlock."}
            </p>
          </div>
          <Link className="btn btn--primary" to="/programs">
            Shop programs →
          </Link>
        </div>
      )}

      <div className="module-grid">
        {CALCULATORS.map((calc) => {
          const locked = calc.membersOnly && !unlocked;
          return (
            <Link
              key={calc.id}
              className={`module-card ${locked ? "module-card--locked" : ""}`}
              to={locked ? "/programs" : `/portal/calculators/${calc.id}`}
            >
              <p className="module-card__phase">{calc.badge}</p>
              <h3>{calc.title}</h3>
              <p>{calc.blurb}</p>
              <p className="module-card__meta">
                {locked ? "Buy a program to unlock" : "Open calculator →"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
