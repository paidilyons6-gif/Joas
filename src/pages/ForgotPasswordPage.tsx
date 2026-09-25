import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getSupabase } from "../lib/supabase";
import { hasLiveBackend } from "../lib/demo";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (!hasLiveBackend()) {
        setMessage(
          "Demo mode: password reset needs live Supabase. Your demo login accepts any password for that email.",
        );
        return;
      }
      const supabase = getSupabase();
      if (!supabase) throw new Error("Auth is not configured");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/sign-in` },
      );
      if (resetError) throw resetError;
      setMessage("Check your email for a reset link ♡");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <p className="eyebrow">Account</p>
        <h1>
          Reset <em>password</em>
        </h1>
        <p className="auth-card__lede">
          Enter your email and we&apos;ll send a reset link when live auth is
          connected.
        </p>
        <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-status">{message}</p>}
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send reset link →"}
          </button>
        </form>
        <p className="auth-card__footer">
          <Link to="/sign-in">Back to log in</Link>
        </p>
      </div>
    </main>
  );
}
