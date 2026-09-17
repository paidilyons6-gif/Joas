import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function SignInPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/portal" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn({ email, password });
      navigate("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>
          Log <em>in</em>
        </h1>
        <p className="auth-card__lede">
          Jump back into your training portal and keep building.
        </p>
        <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@email.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Your password"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Log in →"}
          </button>
        </form>
        <p className="auth-card__footer">
          New here? <Link to="/sign-up">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
