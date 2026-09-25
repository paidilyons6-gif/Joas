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
import { OFFICE_OFFERS, type OfficeOfferId } from "../data/officeOffers";
import { fetchLivePricing, officeDisplay, type LivePricing } from "../lib/livePricing";

export function PricingPage() {
  const { user, activatePlan } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [live, setLive] = useState<LivePricing | null>(null);
  const member = isMember(user?.plan);

  useEffect(() => {
    if (params.get("checkout") === "cancel") {
      setMessage("Checkout cancelled — no charge.");
    }
  }, [params]);

  useEffect(() => {
    void fetchLivePricing().then(setLive);
  }, []);

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
    setBusy("lifetime");
    try {
      const result = await startOfficeCheckout(u.email);
      if (result.demo) {
        await activateMembershipDemo("annual", activatePlan);
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

  function renderCta(id: OfficeOfferId) {
    if (member) {
      return (
        <Link className="btn btn--ink" to="/portal">
          You&apos;re unlocked →
        </Link>
      );
    }
    if (id === "lifetime") {
      return (
        <button
          className="btn btn--primary"
          type="button"
          disabled={busy !== null}
          onClick={() => void buyOneTime()}
        >
          {busy === "lifetime" ? "Opening…" : OFFICE_OFFERS.lifetime.cta}
        </button>
      );
    }
    return (
      <button
        className="btn btn--primary"
        type="button"
        disabled={busy !== null}
        onClick={() => void buySub(id)}
      >
        {busy === id ? "Opening…" : OFFICE_OFFERS[id].cta}
      </button>
    );
  }

  const order: OfficeOfferId[] = ["monthly", "annual", "lifetime"];

  return (
    <main className="page">
      <section className="section page-hero">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">The Office</p>
            <h1 className="section__title">
              Pick how you want to <em>pay</em>
            </h1>
            <p className="section__copy">
              Same full Office access on every option. Monthly stays flexible,
              yearly saves vs month-to-month, lifetime is one payment with no
              renewals.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section pricing">
        <div className="section__inner pricing__grid">
          {order.map((id) => {
            const offer = OFFICE_OFFERS[id];
            const display = officeDisplay(id, live);
            return (
              <Reveal
                key={id}
                className={`price-card${offer.featured ? " price-card--featured" : ""}`}
              >
                <p className="price-card__badge">{offer.badge}</p>
                <h2>{offer.name}</h2>
                <p className="price-card__price">
                  <span>{display.priceLabel}</span>
                  {display.priceSuffix}
                </p>
                <p className="price-card__blurb">{display.blurb}</p>
                <ul>
                  {offer.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {renderCta(id)}
              </Reveal>
            );
          })}
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
