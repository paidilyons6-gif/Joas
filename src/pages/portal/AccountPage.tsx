import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { openBillingPortal } from "../../lib/payments";
import { isAdminEmail } from "../../lib/admin";

export function AccountPage() {
  const { user, signOut, mode } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const admin = isAdminEmail(user?.email);

  if (!user) return <Navigate to="/sign-in" replace />;

  async function manageBilling() {
    setBusy(true);
    setMessage("");
    try {
      const result = await openBillingPortal(user!.email);
      if (result.demo) {
        setMessage(
          "Demo mode: billing portal opens when Stripe is connected. Manage plans on the pricing page for now.",
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Billing portal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Account</p>
      <h1>
        Your <em>membership</em>
      </h1>
      <p className="portal-lede">
        Profile, plan, billing, and what you can access inside The Office.
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
          <span>Plan</span>
          <strong>
            {user.plan === "none"
              ? "Free"
              : user.plan === "annual"
                ? "Founders Year"
                : "Monthly Membership"}
          </strong>
        </div>
        <div className="account-row">
          <span>Unlocked</span>
          <strong>
            {user.plan === "none"
              ? "Startup Foundations (free lessons) · Pricing calculator · CEO scorecard"
              : "All courses · All calculators · Full toolkit · Vault"}
          </strong>
        </div>
        <div className="account-row">
          <span>Mode</span>
          <strong>{mode === "demo" ? "Demo (local)" : "Live (Supabase)"}</strong>
        </div>
      </div>

      <div className="account-actions">
        {admin && (
          <Link className="btn btn--primary" to="/portal/studio">
            Open course Studio →
          </Link>
        )}
        {user.plan === "none" ? (
          <Link className="btn btn--primary" to="/pricing">
            Upgrade membership →
          </Link>
        ) : (
          <button
            className="btn btn--primary"
            type="button"
            disabled={busy}
            onClick={() => void manageBilling()}
          >
            {busy ? "Opening…" : "Manage billing"}
          </button>
        )}
        <button className="btn btn--ghost-ink" type="button" onClick={() => void signOut()}>
          Log out
        </button>
      </div>
      {message && <p className="form-status">{message}</p>}
    </div>
  );
}
