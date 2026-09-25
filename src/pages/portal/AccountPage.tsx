import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";

export function AccountPage() {
  const { user, signOut, mode } = useAuth();
  const admin = isAdminEmail(user?.email);

  if (!user) return <Navigate to="/sign-in" replace />;

  const unlocked = hasAnyProgram(user.programs);

  return (
    <div className="portal-page">
      <p className="eyebrow">Account</p>
      <h1>
        Your <em>account</em>
      </h1>
      <p className="portal-lede">
        Free account plus any programs you&apos;ve purchased. Becky manages
        products and prices in Studio.
      </p>

      <div className="account-panel">
        <div className="account-row">
          <span>Name</span>
          <strong>{user.name}</strong>
        </div>
        <div className="account-row">
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
        <div className="account-row">
          <span>Programs</span>
          <strong>
            {unlocked ? user.programs.join(", ") : "None yet — shop to unlock"}
          </strong>
        </div>
        <div className="account-row">
          <span>Portal</span>
          <strong>
            {unlocked || admin
              ? "Courses · tools · vault · The Office"
              : "Locked until you buy a program"}
          </strong>
        </div>
        <div className="account-row">
          <span>Mode</span>
          <strong>{mode === "demo" ? "Demo (local)" : "Live"}</strong>
        </div>
      </div>

      <div className="account-actions">
        {admin && (
          <Link className="btn btn--primary" to="/portal/studio">
            Open Studio →
          </Link>
        )}
        <Link className="btn btn--ink" to="/programs">
          {unlocked ? "Browse more programs →" : "Shop programs →"}
        </Link>
        <button
          className="btn btn--ghost-ink"
          type="button"
          onClick={() => void signOut()}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
