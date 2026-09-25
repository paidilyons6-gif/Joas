import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { startProgramCheckout } from "../lib/payments";
import { Reveal } from "../components/Reveal";
import { useEffect, useState } from "react";
import {
  fetchStudioProducts,
  type StudioProduct,
} from "../lib/studioProducts";
import { hasProgram } from "../lib/access";

export function ProgramsPage() {
  const { user, grantProgram } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<StudioProduct[]>([]);
  const [loading, setLoading] = useState(true);

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
      void (async () => {
        try {
          if (user) {
            await grantProgram(program);
            setMessage(`You’re in — ${program} is unlocked in your portal ♡`);
            navigate("/portal", { replace: true });
          } else {
            setMessage(
              "Payment received — sign in with the same email to open your program.",
            );
          }
        } catch {
          setMessage(
            "Payment received. Refresh or sign in to see your program.",
          );
        }
      })();
    }
  }, [params, user, grantProgram, navigate]);

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
      const result = await startProgramCheckout(programId, user.email);
      if (result.demo) {
        await grantProgram(programId);
        navigate("/portal");
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
              Buy the program. <em>Train in The Office.</em>
            </h1>
            <p className="section__copy">
              The Office is your home base. Access comes from the programs you
              buy — create a free account, pick a program, pay once or
              subscribe.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section pricing">
        <div className="section__inner pricing__grid">
          {loading && <p className="pricing__note">Loading programs…</p>}
          {!loading && products.length === 0 && (
            <p className="pricing__note">
              No programs listed yet. Becky adds them in Studio.
            </p>
          )}
          {products.map((program) => {
            const owned = hasProgram(user?.programs, program.id);
            return (
              <Reveal
                className="price-card price-card--featured"
                key={program.id}
              >
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
          Already bought something?{" "}
          <Link to={user ? "/portal" : "/sign-in"}>
            {user ? "Open your portal" : "Sign in"}
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
