import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { startProgramCheckout } from "../lib/payments";
import { Reveal } from "../components/Reveal";
import { useEffect, useState } from "react";
import {
  fetchStudioProducts,
  type StudioProduct,
} from "../lib/studioProducts";

const FALLBACK: StudioProduct[] = [
  {
    id: "hotmess",
    slug: "hotmess",
    name: "HOTMESS",
    blurb:
      "HOTMESS stays available on the website — a Bodies by Becca program you can sell directly, separate from BodiesByBecca membership in the app.",
    badge: "Program",
    features: [
      "Sold on the website",
      "Separate from BodiesByBecca app membership",
      "One-time Stripe checkout",
    ],
    amountCents: 9700,
    priceLabel: "$97",
    priceId: "",
    productId: "",
    lookupKey: "bbb_hotmess_onetime",
    active: true,
  },
];

export function ProgramsPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<StudioProduct[]>(FALLBACK);

  useEffect(() => {
    void fetchStudioProducts().then((list) => {
      if (list.length) setProducts(list.filter((p) => p.active));
    });
  }, []);

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
          "Demo mode: program checkout opens when Stripe is connected.",
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
              One-time programs managed in Studio. Office membership
              (subscriptions &amp; lifetime) lives on the Membership page.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section pricing">
        <div className="section__inner pricing__grid">
          {products.map((program) => (
            <Reveal className="price-card price-card--featured" key={program.id}>
              {program.badge && (
                <p className="price-card__badge">{program.badge}</p>
              )}
              <h2>{program.name}</h2>
              <p className="price-card__price">
                <span>{program.priceLabel}</span>
              </p>
              <p className="price-card__blurb">{program.blurb}</p>
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
          Looking for Office membership? See{" "}
          <Link to="/pricing">subscriptions &amp; lifetime</Link>.
        </p>
      </section>
    </main>
  );
}
