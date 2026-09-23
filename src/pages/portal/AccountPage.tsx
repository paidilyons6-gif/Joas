import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { appStoreUrl, playStoreUrl } from "../../data/plans";
import { isAdminEmail } from "../../lib/admin";

export function AccountPage() {
  const { user, signOut, mode } = useAuth();
  const [message, setMessage] = useState("");
  const admin = isAdminEmail(user?.email);

  if (!user) return <Navigate to="/sign-in" replace />;

  function manageMembership() {
    setMessage(
      "BodiesByBecca membership is managed in the Bodies by Becca app — Apple App Store or Google Play subscriptions.",
    );
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Account</p>
      <h1>
        Your <em>membership</em>
      </h1>
      <p className="portal-lede">
        Profile and BodiesByBecca access for The Office. Programs like HOTMESS
        are sold separately on the website.
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
              ? "Free account"
              : user.plan === "annual"
                ? "BodiesByBecca yearly"
                : "BodiesByBecca monthly"}
          </strong>
        </div>
        <div className="account-row">
          <span>Unlocked</span>
          <strong>
            {user.plan === "none"
              ? "Account only — BodiesByBecca membership unlocks The Office"
              : "All courses · calculators · toolkit · vault · The Office"}
          </strong>
        </div>
        <div className="account-row">
          <span>Billing</span>
          <strong>App Store / Play Store</strong>
        </div>
        <div className="account-row">
          <span>Mode</span>
          <strong>{mode === "demo" ? "Demo (local)" : "Live"}</strong>
        </div>
      </div>

      <div className="account-actions">
        {admin && (
          <Link className="btn btn--primary" to="/portal/studio">
            Open course Studio →
          </Link>
        )}
        {user.plan === "none" ? (
          <>
            <a className="btn btn--primary" href={appStoreUrl()} target="_blank" rel="noreferrer">
              App Store →
            </a>
            <a className="btn btn--ink" href={playStoreUrl()} target="_blank" rel="noreferrer">
              Play Store →
            </a>
            <Link className="btn btn--ghost-ink" to="/programs">
              Shop HOTMESS →
            </Link>
          </>
        ) : (
          <button
            className="btn btn--primary"
            type="button"
            onClick={manageMembership}
          >
            Manage in app
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
