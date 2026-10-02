import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { joinWaitlist } from "../lib/waitlist";

const HERO_IMAGE = "/hero-becca.jpg";

export function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [already, setAlready] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await joinWaitlist(email);
      setAlready(Boolean(result.already));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the list");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="waitlist"
      style={{ ["--hero-image" as string]: `url(${HERO_IMAGE})` }}
    >
      <div className="waitlist__media" aria-hidden="true" />
      <div className="waitlist__veil" aria-hidden="true" />
      <div className="waitlist__content">
        <p className="waitlist__eyebrow">Coming soon</p>
        <h1>
          <Logo variant="hero" />
        </h1>
        <p className="waitlist__headline">
          The Office opens <em>tomorrow.</em>
        </p>
        <p className="waitlist__lede">
          Drop your email — Becca will send the launch link when programs go
          live.
        </p>

        {done ? (
          <div className="waitlist__success" role="status">
            <h2>{already ? "You’re already on the list ♡" : "You’re on the list ♡"}</h2>
            <p>Watch your inbox for the launch note.</p>
          </div>
        ) : (
          <form className="waitlist__form" onSubmit={(e) => void onSubmit(e)}>
            <label className="waitlist__field">
              <span className="visually-hidden">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={busy}
            >
              {busy ? "Saving…" : "Notify me →"}
            </button>
            {error && <p className="form-error">{error}</p>}
          </form>
        )}

        <p className="waitlist__legal">
          No spam.{" "}
          <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
        </p>
      </div>
    </main>
  );
}
