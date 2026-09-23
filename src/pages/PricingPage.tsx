import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PLANS, type PlanId } from "../data/plans";
import { useAuth } from "../lib/auth";
import { startCheckout } from "../lib/payments";
import { Reveal } from "../components/Reveal";

export function PricingPage() {
  const { user, activatePlan } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (params.get("checkout") === "cancel") {
      setMessage("Checkout cancelled — no charge. Pick a plan whenever you're ready.");
    }
  }, [params]);

  async function choose(plan: PlanId) {
    setMessage("");
    if (!user) {
      navigate("/sign-up", { state: { plan } });
      return;
    }

    setBusy(plan);
    try {
      const result = await startCheckout(plan, user.email);
      if (result.demo) {
        await activatePlan(plan);
        navigate("/portal?checkout=success");
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
            <p className="eyebrow">Membership</p>
            <h1 className="section__title">
              Invest in the <em>damn</em> business.
            </h1>
            <p className="section__copy">
              Free to create an account. Subscribe when you&apos;re ready to
              unlock courses, calculators, toolkit, vault, and The Office.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section pricing">
        <div className="section__inner pricing__grid">
          {(Object.keys(PLANS) as PlanId[]).map((id) => {
            const plan = PLANS[id];
            return (
              <Reveal
                className={`price-card ${id === "annual" ? "price-card--featured" : ""}`}
                key={id}
              >
                {plan.highlight && (
                  <p className="price-card__badge">{plan.highlight}</p>
                )}
                <h2>{plan.name}</h2>
                <p className="price-card__price">
                  <span>{plan.priceLabel}</span>
                  {plan.cadence}
                </p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button
                  className="btn btn--primary"
                  type="button"
                  disabled={busy === id}
                  onClick={() => void choose(id)}
                >
                  {busy === id
                    ? "Working…"
                    : id === "annual"
                      ? "Get Founders Year →"
                      : "Start monthly →"}
                </button>
              </Reveal>
            );
          })}
        </div>
        {message && <p className="form-status">{message}</p>}
        <p className="pricing__note">
          Already have an account? <Link to="/sign-in">Log in</Link> · Questions?{" "}
          <Link to="/sign-up">Join free first</Link>
        </p>
      </section>
    </main>
  );
}
