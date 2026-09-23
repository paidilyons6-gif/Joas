import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  activateMembershipDemo,
  startOfficeCheckout,
  startSubscriptionCheckout,
} from "../lib/payments";
import { Reveal } from "../components/Reveal";
import { isMember } from "../lib/access";
import type { PlanId } from "../data/plans";

export function PricingPage() {
  const { user, activatePlan } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const member = isMember(user?.plan);

  useEffect(() => {
    if (params.get("checkout") === "cancel") {
      setMessage("Checkout cancelled — no charge.");
    }
  }, [params]);

  async function requireUser(planHint: PlanId | "office") {
    if (!user) {
      navigate("/sign-up", {
        state: { plan: planHint === "office" ? "monthly" : planHint },
      });
      return null;
    }
    return user;
  }

  async function buyOneTime() {
    setMessage("");
    const u = await requireUser("office");
    if (!u) return;
    setBusy("office");
    try {
      const result = await startOfficeCheckout(u.email);
      if (result.demo) {
        await activateMembershipDemo("monthly", activatePlan);
        navigate("/portal?checkout=success");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setBusy(null);
    }
  }

  async function buySub(plan: PlanId) {
    setMessage("");
    const u = await requireUser(plan);
    if (!u) return;
    setBusy(plan);
    try {
      const result = await startSubscriptionCheckout(plan, u.email);
      if (result.demo) {
        await activateMembershipDemo(plan, activatePlan);
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
            <p className="eyebrow">The Office</p>
            <h1 className="section__title">
              Subscribe or pay <em>once</em>
            </h1>
            <p className="section__copy">
              Create a free account, then unlock The Office with a monthly or
              yearly subscription — or a one-time purchase. Same portal access
              either way.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section pricing">
        <div className="section__inner pricing__grid">
          <Reveal className="price-card">
            <p className="price-card__badge">Subscription</p>
            <h2>Monthly</h2>
            <p className="price-card__price">
              <span>$49</span>/month
            </p>
            <ul>
              <li>Full Office access</li>
              <li>Courses, tools, vault, community</li>
              <li>Cancel anytime in Stripe billing</li>
              <li>Renews automatically</li>
            </ul>
            {member ? (
              <Link className="btn btn--ink" to="/portal">
                You&apos;re unlocked →
              </Link>
            ) : (
              <button
                className="btn btn--primary"
                type="button"
                disabled={busy !== null}
                onClick={() => void buySub("monthly")}
              >
                {busy === "monthly" ? "Opening…" : "Subscribe monthly →"}
              </button>
            )}
          </Reveal>

          <Reveal className="price-card price-card--featured">
            <p className="price-card__badge">Best value</p>
            <h2>Yearly</h2>
            <p className="price-card__price">
              <span>$397</span>/year
            </p>
            <ul>
              <li>Everything in monthly</li>
              <li>~2 months free vs monthly</li>
              <li>Full Office access</li>
              <li>Renews yearly</li>
            </ul>
            {member ? (
              <Link className="btn btn--ink" to="/portal">
                You&apos;re unlocked →
              </Link>
            ) : (
              <button
                className="btn btn--primary"
                type="button"
                disabled={busy !== null}
                onClick={() => void buySub("annual")}
              >
                {busy === "annual" ? "Opening…" : "Subscribe yearly →"}
              </button>
            )}
          </Reveal>

          <Reveal className="price-card">
            <p className="price-card__badge">One-time</p>
            <h2>Pay once</h2>
            <p className="price-card__price">
              <span>$197</span>
            </p>
            <ul>
              <li>Full Office unlock</li>
              <li>No recurring charge</li>
              <li>Same courses & tools</li>
              <li>One payment on this site</li>
            </ul>
            {member ? (
              <Link className="btn btn--ink" to="/portal">
                You&apos;re unlocked →
              </Link>
            ) : (
              <button
                className="btn btn--primary"
                type="button"
                disabled={busy !== null}
                onClick={() => void buyOneTime()}
              >
                {busy === "office" ? "Opening…" : "Buy once →"}
              </button>
            )}
          </Reveal>
        </div>

        {message && <p className="form-status">{message}</p>}
        <p className="pricing__note">
          BodiesByBecca app membership (App Store / Play) stays available after
          October challenges — this page is website billing for The Office.
        </p>
      </section>
    </main>
  );
}
