import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function SignUpPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const plan = (location.state as { plan?: string } | null)?.plan;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <Navigate
        to={plan === "monthly" || plan === "annual" ? `/pricing?plan=${plan}` : "/portal"}
        replace
      />
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signUp({ name, email, password });
      navigate(
        plan === "monthly" || plan === "annual"
          ? `/pricing?plan=${plan}`
          : "/portal",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <p className="eyebrow">Join free</p>
        <h1>
          Create your <em>account</em>
        </h1>
        <p className="auth-card__lede">
          {plan === "monthly" || plan === "annual"
            ? "Create your free site account, then get BodiesByBecca membership in the App Store or Play Store to unlock The Office."
            : "Create a free account. BodiesByBecca membership (in the app) unlocks The Office. Programs like HOTMESS sell on the site."}
        </p>
        <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              placeholder="Becca"
            />
          </label>
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
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Let's do this →"}
          </button>
        </form>
        <p className="auth-card__footer">
          Already in? <Link to="/sign-in">Log in</Link>
        </p>
      </div>
    </main>
  );
}
