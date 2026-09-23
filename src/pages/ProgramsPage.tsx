import { Link } from "react-router-dom";
import { PROGRAMS } from "../data/programs";
import { useAuth } from "../lib/auth";
import { startProgramCheckout } from "../lib/payments";
import { Reveal } from "../components/Reveal";
import { useState } from "react";

export function ProgramsPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function buy(programId: string) {
    setMessage("");
    setBusy(programId);
    try {
      const result = await startProgramCheckout(
        programId,
        user?.email || undefined,
      );
      if (result.demo) {
        setMessage(
          "Demo mode: program checkout opens when Stripe + program price IDs are set. Membership stays in the Bodies by Becca app.",
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="page">
      <section className="section page-hero">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">Programs</p>
            <h1 className="section__title">
              Programs you sell <em>on the site</em>
            </h1>
            <p className="section__copy">
              BodiesByBecca membership lives in the app (App Store / Play Store).
              Programs like HOTMESS keep selling here on the website.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section pricing">
        <div className="section__inner pricing__grid">
          {PROGRAMS.map((program) => (
            <Reveal className="price-card price-card--featured" key={program.id}>
              {program.badge && (
                <p className="price-card__badge">{program.badge}</p>
              )}
              <h2>{program.name}</h2>
              <p className="price-card__price">
                <span>{program.priceLabel}</span>
              </p>
              <p style={{ color: "var(--ink-muted)", marginBottom: "1rem" }}>
                {program.blurb}
              </p>
              <ul>
                {program.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className="btn btn--primary"
                type="button"
                disabled={busy === program.id}
                onClick={() => void buy(program.id)}
              >
                {busy === program.id ? "Opening…" : `Get ${program.name} →`}
              </button>
            </Reveal>
          ))}
        </div>
        {message && <p className="form-status">{message}</p>}
        <p className="pricing__note">
          Looking for ongoing membership? That&apos;s{" "}
          <Link to="/pricing">BodiesByBecca in the app</Link>.
        </p>
      </section>
    </main>
  );
}
