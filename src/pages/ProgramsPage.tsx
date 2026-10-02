import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { startProgramCheckout } from "../lib/payments";
import { Reveal } from "../components/Reveal";
import { useEffect, useRef, useState } from "react";
import {
  fetchStudioProducts,
  type StudioProduct,
} from "../lib/studioProducts";
import { hasProgram } from "../lib/access";
import { coursesOpenLabel } from "../lib/coursesOpen";

export function ProgramsPage() {
  const { user, waitForProgram, refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<StudioProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const handledSuccess = useRef<string | null>(null);

  useEffect(() => {
    void fetchStudioProducts()
      .then((list) => setProducts(list.filter((p) => p.active)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const status = params.get("checkout");
    const program = params.get("program");
    if (status === "cancel") {
      setMessage("Checkout cancelled — no charge.");
      return;
    }
    if (status === "success" && program) {
      const key = `${program}:${user?.id || "anon"}`;
      if (handledSuccess.current === key) return;
      handledSuccess.current = key;
      void (async () => {
        if (!user) {
          setMessage(
            "Payment received — sign in with the same email to open your program.",
          );
          return;
        }
        setMessage("Confirming your purchase…");
        const ok = await waitForProgram(program);
        if (ok) {
          setMessage(`You’re in — ${program} is unlocked in your portal ♡`);
          navigate("/portal?checkout=success", { replace: true });
        } else {
          await refresh();
          setMessage(
            "Payment received. If your program isn’t open yet, wait a moment and refresh — unlocks sync from Stripe.",
          );
        }
      })();
    }
  }, [params, user, waitForProgram, refresh, navigate]);

  async function buy(programId: string) {
    setMessage("");
    if (!user) {
      navigate("/sign-up", { state: { program: programId } });
      return;
    }
    if (hasProgram(user.programs, programId)) {
      navigate("/portal");
      return;
    }
    setBusy(programId);
    try {
      await startProgramCheckout(programId, user.email);
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
              Buy the program. <em>Train in The Office.</em>
            </h1>
            <p className="section__copy">
              Like The Village: sign up free, buy Becca&apos;s program, and get
              access — courses with video lessons, tools, and Business Meeting
              inside The Office.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section pricing">
        <div className="section__inner pricing__grid">
          {loading && <p className="pricing__note">Loading programs…</p>}
          {!loading && products.length === 0 && (
            <p className="pricing__note">
              No programs yet — Becca adds them in Studio.
            </p>
          )}
          {products.map((program) => {
            const owned = hasProgram(user?.programs, program.id);
            const hasCompare =
              !!program.compareAtCents &&
              program.compareAtCents > program.amountCents;
            return (
              <Reveal
                className="price-card price-card--featured"
                key={program.id}
              >
                {program.imageUrl && (
                  <div
                    className="price-card__media"
                    style={{ backgroundImage: `url(${program.imageUrl})` }}
                    role="img"
                    aria-label={program.name}
                  />
                )}
                {program.badge && (
                  <p className="price-card__badge">{program.badge}</p>
                )}
                <h2>{program.name}</h2>
                <p className="price-card__price">
                  {hasCompare && (
                    <span className="price-card__compare">
                      {program.compareAtLabel}
                    </span>
                  )}
                  <span>{program.priceLabel}</span>
                  {hasCompare && (
                    <span className="price-card__early">Early bird</span>
                  )}
                </p>
                <p className="price-card__blurb">{program.blurb}</p>
                <ul>
                  {program.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {owned ? (
                  <Link className="btn btn--ink" to="/portal">
                    Open in portal →
                  </Link>
                ) : (
                  <button
                    className="btn btn--primary"
                    type="button"
                    disabled={busy === program.id}
                    onClick={() => void buy(program.id)}
                  >
                    {busy === program.id
                      ? "Opening…"
                      : user
                        ? `Get ${program.name} →`
                        : `Sign up & get ${program.name} →`}
                  </button>
                )}
              </Reveal>
            );
          })}
        </div>
        {message && <p className="form-status">{message}</p>}
        <p className="pricing__note">
          Course training {coursesOpenLabel().toLowerCase()}. Platform access
          unlocks as soon as you buy.{" "}
          <Link to={user ? "/portal" : "/sign-in"}>
            {user ? "Open your portal" : "Sign in"}
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
