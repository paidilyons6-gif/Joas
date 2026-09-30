import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { TOOLS } from "../../data/tools";
import { useAuth } from "../../lib/auth";
import { canAccessContent, hasAnyProgram } from "../../lib/access";
import { isAdminEmail } from "../../lib/admin";
import { useClientPreview } from "../../lib/clientPreview";
import {
  BUILD_LIVE_EVENT,
  isToolLive,
  readBuildLiveLocal,
  type BuildLiveSettings,
} from "../../lib/buildLive";
import { fetchBuildLive, saveBuildLiveRemote } from "../../lib/coursesRepo";

export function ToolsPage() {
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

  const visibleTools = TOOLS.filter((tool) => coach || isToolLive(tool.id, live));

  async function toggleLive(id: string) {
    const next: BuildLiveSettings = {
      ...live,
      toolkit: {
        ...live.toolkit,
        [id]: !isToolLive(id, live),
      },
    };
    setLive(next);
    await saveBuildLiveRemote(next);
    setStatus(
      isToolLive(id, next) ? `${id} is LIVE for clients` : `${id} hidden from clients`,
    );
  }

  return (
    <div className="portal-page">
      <p className="eyebrow">Startup toolkit</p>
      <h1>
        Worksheets that move the <em>needle</em>
      </h1>
      <p className="portal-lede">
        {coach
          ? "Edit and choose which toolkit items are LIVE for clients."
          : "Offer builder, ideal client, launch planner, and weekly CEO scorecard — unlocked when you buy a program."}
      </p>

      {status && coach && <p className="form-status">{status}</p>}

      {isAdmin && preview && (
        <div className="upgrade-banner" role="status">
          <div>
            <h2>Client view is on</h2>
            <p>
              This is the locked buyer experience. Switch to Coach view to edit
              and unlock as admin.
            </p>
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
            <h2>Toolkit needs a program</h2>
            <p>
              {ownsProgram
                ? "Refresh your access if you just purchased."
                : "Signed up is free — buy a program to open these worksheets."}
            </p>
          </div>
          <Link className="btn btn--primary" to="/programs">
            Shop programs →
          </Link>
        </div>
      )}

      <div className="module-grid">
        {visibleTools.map((tool) => {
          const locked = tool.membersOnly && !unlocked;
          const liveOn = isToolLive(tool.id, live);
          return (
            <div
              key={tool.id}
              className={`module-card ${locked ? "module-card--locked" : ""} ${coach && !liveOn ? "module-card--draft" : ""}`}
            >
              <p className="module-card__phase">
                {coach ? (liveOn ? "LIVE" : "Hidden") : tool.badge}
              </p>
              <h3>{tool.title}</h3>
              <p>{tool.blurb}</p>
              <p className="module-card__meta">
                {locked ? "Buy a program to unlock" : "Open tool →"}
              </p>
              <div className="module-card__actions">
                <Link
                  className="btn btn--ink"
                  to={locked ? "/programs" : `/portal/tools/${tool.id}`}
                >
                  {locked ? "Unlock →" : "Open →"}
                </Link>
                {coach && (
                  <button
                    className={`btn ${liveOn ? "btn--ghost-ink" : "btn--primary"}`}
                    type="button"
                    onClick={() => void toggleLive(tool.id)}
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
