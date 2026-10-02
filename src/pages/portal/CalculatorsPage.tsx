import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CALCULATORS } from "../../data/calculators";
import { useAuth } from "../../lib/auth";
import { canAccessContent, hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  BUILD_LIVE_EVENT,
  isCalcLive,
  readBuildLiveLocal,
  type BuildLiveSettings,
} from "../../lib/buildLive";
import { fetchBuildLive, saveBuildLiveRemote } from "../../lib/coursesRepo";

export function CalculatorsPage() {
  const { user } = useAuth();
  const { preview, setPreview } = useClientPreview();
  const [live, setLive] = useState<BuildLiveSettings>(() => readBuildLiveLocal());
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetchBuildLive().then(setLive);
    const sync = () => setLive(readBuildLiveLocal());
    window.addEventListener(BUILD_LIVE_EVENT, sync);
    return () => window.removeEventListener(BUILD_LIVE_EVENT, sync);
  }, []);

  const isAdmin = isAdminEmail(user?.email);
  const coach = isAdmin && !preview;
  const unlocked = canAccessContent(user?.programs, {
    isAdmin: isAdmin && !preview,
  });
  const ownsProgram = hasAnyProgram(user?.programs);

  if (!user) return <Navigate to="/sign-in" replace />;

  const visibleCalcs = CALCULATORS.filter(
    (calc) => coach || isCalcLive(calc.id, live),
  );

  async function toggleLive(id: string) {
    const next: BuildLiveSettings = {
      ...live,
      calculators: {
        ...live.calculators,
        [id]: !isCalcLive(id, live),
      },
    };
    setLive(next);
    await saveBuildLiveRemote(next);
    setStatus(
      isCalcLive(id, next) ? `${id} is LIVE for clients` : `${id} hidden from clients`,
    );
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Financial suite</p>
      <h1>
        Calculators that create <em>clarity</em>
      </h1>
      <p className="portal-lede">
        {coach
          ? "Edit and choose which calculators are LIVE for clients."
          : "Price, break-even, goals, runway, profit, and offer mix — unlocked when you buy a program."}
      </p>

      {status && coach && <p className="form-status">{status}</p>}

      {isAdmin && preview && (
        <div className="upgrade-banner" role="status">
          <div>
            <h2>Client view is on</h2>
            <p>Switch to Coach view to use calculators as admin.</p>
          </div>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setPreview(false)}
          >
            Coach view →
          </button>
        </div>
      )}

      {!unlocked && !preview && (
        <div className="upgrade-banner">
          <div>
            <h2>Calculators need a program</h2>
            <p>
              {ownsProgram
                ? "Refresh your access if you just purchased."
                : "A free account isn’t enough — buy a program to unlock."}
            </p>
          </div>
          <Link className="btn btn--primary" to="/programs">
            Shop programs →
          </Link>
        </div>
      )}

      <div className="module-grid">
        {visibleCalcs.map((calc) => {
          const locked = calc.membersOnly && !unlocked;
          const liveOn = isCalcLive(calc.id, live);
          return (
            <div
              key={calc.id}
              className={`module-card ${locked ? "module-card--locked" : ""} ${coach && !liveOn ? "module-card--draft" : ""}`}
            >
              <p className="module-card__phase">
                {coach ? (liveOn ? "LIVE" : "Hidden") : calc.badge}
              </p>
              <h3>{calc.title}</h3>
              <p>{calc.blurb}</p>
              <p className="module-card__meta">
                {locked ? "Buy a program to unlock" : "Open calculator →"}
              </p>
              <div className="module-card__actions">
                <Link
                  className="btn btn--ink"
                  to={locked ? "/programs" : `/portal/calculators/${calc.id}`}
                >
                  {locked ? "Unlock →" : "Open →"}
                </Link>
                {coach && (
                  <button
                    className={`btn ${liveOn ? "btn--ghost-ink" : "btn--primary"}`}
                    type="button"
                    onClick={() => void toggleLive(calc.id)}
                  >
                    {liveOn ? "Set hidden" : "Make LIVE →"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
