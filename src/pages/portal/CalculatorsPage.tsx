import { Link, Navigate } from "react-router-dom";
import { CALCULATORS } from "../../data/calculators";
import { useAuth } from "../../lib/auth";
import { canAccessContent } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";

export function CalculatorsPage() {
  const { user } = useAuth();
  const { preview } = useClientPreview();
  if (!user) return <Navigate to="/sign-in" replace />;
  const member = canAccessContent(user.programs, {
    isAdmin: isAdminEmail(user.email) && !preview,
  });

  return (
    <div className="portal-page">
      <p className="eyebrow">Financial suite</p>
      <h1>
        Calculators that create <em>clarity</em>
      </h1>
      <p className="portal-lede">
        Price, break-even, goals, runway, profit, and offer mix — founder math
        without the spreadsheet spiral.
      </p>

      <div className="module-grid">
        {CALCULATORS.map((calc) => {
          const locked = calc.membersOnly && !member;
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
                {locked ? "Members only" : "Open calculator →"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
