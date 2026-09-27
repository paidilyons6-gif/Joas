import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import {
  hasWaitlistBypass,
  isSpaFallbackResponse,
  isWaitlistMode,
  setWaitlistBypass,
} from "../lib/waitlist";

/**
 * Private staff entry while the public waitlist gate is up.
 * Password must match STUDIO_PRICE_SECRET (same as Studio pricing),
 * or VITE_WAITLIST_BYPASS_SECRET for local preview.
 */
export function EnterPage() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isWaitlistMode() || hasWaitlistBypass()) {
    return <Navigate to="/" replace />;
  }

  function tryLocalBypass(trimmed: string) {
    const local = (
      import.meta.env.VITE_WAITLIST_BYPASS_SECRET as string | undefined
    )?.trim();
    if (local && trimmed === local) {
      setWaitlistBypass(true);
      navigate("/", { replace: true });
      return true;
    }
    return false;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const trimmed = secret.trim();

    try {
      const res = await fetch("/.netlify/functions/list-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "r.lyons1@icloud.com",
          secret: trimmed,
        }),
      });
      const text = await res.text();

      if (isSpaFallbackResponse(res, text)) {
        if (tryLocalBypass(trimmed)) return;
        setError(
          "Staff entry needs Netlify functions, or set VITE_WAITLIST_BYPASS_SECRET locally.",
        );
        return;
      }

      if (res.status === 403) {
        setError("Wrong password.");
        return;
      }

      if (res.ok) {
        setWaitlistBypass(true);
        navigate("/", { replace: true });
        return;
      }

      if (res.status === 503 && /STUDIO_PRICE_SECRET/i.test(text)) {
        if (tryLocalBypass(trimmed)) return;
        setError(text);
        return;
      }

      // Secret matched but waitlist table/config issue — still allow staff in.
      if (res.status === 500 || res.status === 503) {
        setWaitlistBypass(true);
        navigate("/", { replace: true });
        return;
      }

      setError("Could not verify password.");
    } catch {
      if (tryLocalBypass(trimmed)) return;
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <p className="eyebrow">Staff</p>
        <h1>
          <Logo />
        </h1>
        <p className="auth-card__lede">
          Enter with your Studio password to preview the full site while the
          waitlist gate is up.
        </p>
        <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Studio password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Checking…" : "Enter site →"}
          </button>
        </form>
      </div>
    </main>
  );
}
