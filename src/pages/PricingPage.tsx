import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PLANS, appStoreUrl, playStoreUrl, type PlanId } from "../data/plans";
import { useAuth } from "../lib/auth";
import { activateMembershipDemo } from "../lib/payments";
import { Reveal } from "../components/Reveal";
import { isMember } from "../lib/access";

export function PricingPage() {
  const { user, activatePlan } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const member = isMember(user?.plan);

  useEffect(() => {
    if (params.get("checkout") === "cancel") {
      setMessage("No charge. Subscribe anytime in the Bodies by Becca app.");
    }
  }, [params]);

  async function unlockDemo(plan: PlanId) {
    if (!user) {
      navigate("/sign-up", { state: { plan } });
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await activateMembershipDemo(plan, activatePlan);
      navigate("/portal?checkout=success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not unlock");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <section className="section page-hero">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">BodiesByBecca membership</p>
            <h1 className="section__title">
              Membership in the <em>app</em>
            </h1>
            <p className="section__copy">
              Challenges wrap after October. Ongoing access is{" "}
              <strong>BodiesByBecca membership</strong> — billed through the
              Apple App Store or Google Play Store. Create a free website
              account, subscribe in the app, then open The Office here.
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
                {isCurrent || member ? (
                  <Link className="btn btn--ink" to="/portal/account">
                    Membership active · account →
                  </Link>
                ) : (
                  <div className="price-card__stores">
                    <a
                      className="btn btn--primary"
                      href={appStoreUrl()}
                      target="_blank"
                      rel="noreferrer"
                    >
                      App Store →
                    </a>
                    <a
                      className="btn btn--ink"
                      href={playStoreUrl()}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Play Store →
                    </a>
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>

        <div className="pricing-faq" style={{ marginTop: "2rem" }}>
          <h2>Already subscribed in the app?</h2>
          <p style={{ textAlign: "center", color: "var(--ink-muted)", marginBottom: "1rem" }}>
            Create or log into the same email on this site. Demo unlock is for
            preview; production can link app receipts to your portal account.
          </p>
          {user && !member && (
            <div className="account-actions" style={{ justifyContent: "center" }}>
              <button
                className="btn btn--ghost-ink"
                type="button"
                disabled={busy}
                onClick={() => void unlockDemo("monthly")}
              >
                {busy ? "Unlocking…" : "Preview unlock (demo) →"}
              </button>
            </div>
          )}
          {!user && (
            <p className="pricing__note">
              <Link to="/sign-up">Create free account</Link> ·{" "}
              <Link to="/sign-in">Log in</Link>
            </p>
          )}
        </div>

        {message && <p className="form-status">{message}</p>}

        <div className="pricing-faq">
          <h2>How it works</h2>
          <dl>
            <div>
              <dt>BodiesByBecca membership</dt>
              <dd>
                Recurring membership through Apple or Google after challenges end
                in October. Cancel in your phone&apos;s subscriptions.
              </dd>
            </div>
            <div>
              <dt>Programs on the website</dt>
              <dd>
                HOTMESS and other programs keep selling on this site — separate
                from app membership.{" "}
                <Link to="/programs">See programs →</Link>
              </dd>
            </div>
            <div>
              <dt>The Office portal</dt>
              <dd>
                Free to create an account. Courses and tools unlock with an
                active BodiesByBecca membership.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
