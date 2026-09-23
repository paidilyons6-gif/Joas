import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { appStoreUrl, playStoreUrl } from "../data/plans";
import { useAuth } from "../lib/auth";
import {
  activateMembershipDemo,
  startOfficeCheckout,
} from "../lib/payments";
import { hasStripe } from "../lib/demo";
import { Reveal } from "../components/Reveal";
import { isMember } from "../lib/access";

export function PricingPage() {
  const { user, activatePlan } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const member = isMember(user?.plan);
  const stripeReady = hasStripe();

  useEffect(() => {
    if (params.get("checkout") === "cancel") {
      setMessage("Checkout cancelled — no charge.");
    }
  }, [params]);

  async function buyOffice() {
    setMessage("");
    if (!user) {
      navigate("/sign-up", { state: { plan: "monthly" } });
      return;
    }
    setBusy(true);
    try {
      const result = await startOfficeCheckout(user.email);
      if (result.demo) {
        await activateMembershipDemo("monthly", activatePlan);
        navigate("/portal?checkout=success");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <section className="section page-hero">
        <div className="section__inner">
          <Reveal>
            <p className="eyebrow">Access</p>
            <h1 className="section__title">
              Unlock <em>The Office</em>
            </h1>
            <p className="section__copy">
              Create a free account, then unlock everything with a one-time
              Office purchase on this site — or BodiesByBecca membership in the
              app (App Store / Play) after challenges end in October.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section pricing">
        <div className="section__inner pricing__grid">
          <Reveal className="price-card price-card--featured">
            <p className="price-card__badge">Website · one-time</p>
            <h2>The Office</h2>
            <p className="price-card__price">
              <span>One-time</span>
              {" "}via Stripe
            </p>
            <ul>
              <li>Full Office portal unlock</li>
              <li>All courses, calculators & toolkit</li>
              <li>Vault + community</li>
              <li>Pay once on this website</li>
            </ul>
            {member ? (
              <Link className="btn btn--ink" to="/portal">
                You&apos;re unlocked · open portal →
              </Link>
            ) : (
              <button
                className="btn btn--primary"
                type="button"
                disabled={busy}
                onClick={() => void buyOffice()}
              >
                {busy
                  ? "Opening…"
                  : stripeReady
                    ? "Buy The Office →"
                    : "Unlock (demo) →"}
              </button>
            )}
          </Reveal>

          <Reveal className="price-card">
            <p className="price-card__badge">App · recurring</p>
            <h2>BodiesByBecca</h2>
            <p className="price-card__price">
              <span>In-app</span>
              {" "}membership
            </p>
            <ul>
              <li>BodiesByBecca membership</li>
              <li>Billed via App Store or Play Store</li>
              <li>After challenges end (October)</li>
              <li>Cancel in your device subscriptions</li>
            </ul>
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
          </Reveal>
        </div>

        {message && <p className="form-status">{message}</p>}
        <p className="pricing__note">
          Programs like <Link to="/programs">HOTMESS</Link> are sold separately
          on the site.
          {!stripeReady && (
            <>
              {" "}
              Demo mode: Office unlock works on this device until Stripe price
              IDs are set on Netlify.
            </>
          )}
        </p>
      </section>
    </main>
  );
}
