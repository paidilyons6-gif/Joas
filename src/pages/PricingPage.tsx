import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PLANS, type PlanId } from "../data/plans";
import { useAuth } from "../lib/auth";
import { hasStripe } from "../lib/demo";
import { startCheckout } from "../lib/payments";
import { Reveal } from "../components/Reveal";
import { isMember } from "../lib/access";

export function PricingPage() {
  const { user, activatePlan } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [message, setMessage] = useState("");
  const stripeReady = hasStripe();
  const autoStarted = useRef(false);

  useEffect(() => {
    if (params.get("checkout") === "cancel") {
      setMessage("Checkout cancelled — no charge. Subscribe whenever you're ready.");
    }
  }, [params]);

  useEffect(() => {
    const planParam = params.get("plan");
    if (autoStarted.current || !user || !planParam) return;
    if (planParam !== "monthly" && planParam !== "annual") return;
    if (isMember(user.plan)) return;
    autoStarted.current = true;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("plan");
        return next;
      },
      { replace: true },
    );
    void choose(planParam);
  }, [user, params, setParams]);

  async function choose(plan: PlanId) {
    setMessage("");
    if (!user) {
      navigate("/sign-up", { state: { plan } });
      return;
    }

    if (user.plan === plan) {
      setMessage("You're already on this plan. Manage it from Account.");
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
            <p className="eyebrow">Subscribe</p>
            <h1 className="section__title">
              Membership that <em>keeps</em> paying off.
            </h1>
            <p className="section__copy">
              Create a free account, then subscribe monthly or yearly. Card
              payments renew automatically — cancel anytime from your account.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section pricing">
        <div className="section__inner pricing__grid">
          {(Object.keys(PLANS) as PlanId[]).map((id) => {
            const plan = PLANS[id];
            const isCurrent = user?.plan === id;
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
                {isCurrent ? (
                  <Link className="btn btn--ink" to="/portal/account">
                    Current plan · manage →
                  </Link>
                ) : (
                  <button
                    className="btn btn--primary"
                    type="button"
                    disabled={busy === id}
                    onClick={() => void choose(id)}
                  >
                    {busy === id
                      ? stripeReady
                        ? "Opening checkout…"
                        : "Activating…"
                      : id === "annual"
                        ? "Subscribe yearly →"
                        : "Subscribe monthly →"}
                  </button>
                )}
              </Reveal>
            );
          })}
        </div>
        {message && <p className="form-status">{message}</p>}
        <p className="pricing__note">
          {stripeReady
            ? "Secure checkout powered by Stripe. Subscriptions renew until you cancel."
            : "Demo mode: subscribe unlocks instantly on this device. Connect Stripe on Netlify for real card payments."}
          <br />
          Already have an account? <Link to="/sign-in">Log in</Link> ·{" "}
          <Link to="/sign-up">Join free first</Link>
        </p>

        <div className="pricing-faq">
          <h2>How subscriptions work</h2>
          <dl>
            <div>
              <dt>When do I get charged?</dt>
              <dd>
                At checkout, then every month ($49) or every year ($397) until you
                cancel.
              </dd>
            </div>
            <div>
              <dt>Can I cancel?</dt>
              <dd>
                Yes — anytime from Account → Manage subscription. You keep access
                through the period you already paid for.
              </dd>
            </div>
            <div>
              <dt>What unlocks?</dt>
              <dd>
                All course tracks, calculators, toolkit, vault, and posting in
                The Office.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
