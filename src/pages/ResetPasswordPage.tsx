import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSupabase } from "../lib/supabase";
import { hasLiveBackend } from "../lib/demo";

/** Handles Supabase recovery links and lets members set a new password. */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hasLiveBackend()) {
      setError("Password reset needs live Supabase auth.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setError("Auth is not configured.");
      return;
    }

    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setMessage("Choose a new password for The Office.");
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setReady(true);
        setMessage("Choose a new password for The Office.");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Auth is not configured");
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setMessage("Password updated — heading into The Office…");
      window.setTimeout(() => navigate("/portal"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <p className="eyebrow">Account</p>
        <h1>
          New <em>password</em>
        </h1>
        <p className="auth-card__lede">
          {ready
            ? "You’re in from the reset link. Set a password you’ll remember."
            : "Open the reset link from your email on this device, then set a new password here."}
        </p>
        <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            New password
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              disabled={!ready}
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Type it again"
              disabled={!ready}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-status">{message}</p>}
          <button
            className="btn btn--primary"
            type="submit"
            disabled={busy || !ready}
          >
            {busy ? "Saving…" : "Save password →"}
          </button>
        </form>
        <p className="auth-card__footer">
          <Link to="/forgot-password">Resend reset email</Link>
          <br />
          <Link to="/sign-in">Back to log in</Link>
        </p>
      </div>
    </main>
  );
}
