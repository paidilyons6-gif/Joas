import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogoLink } from "./Logo";
import { useAuth } from "../lib/auth";
import { hasAnyProgram } from "../lib/access";
import { isAdminEmail } from "../lib/admin";
import { useClientPreview } from "../lib/clientPreview";
import {
  DEFAULT_NAV,
  NAV_META,
  type NavSettings,
  type NavTopicId,
} from "../lib/studio";
import { fetchNavSettings } from "../lib/coursesRepo";

const PATHS: Record<NavTopicId, string> = {
  home: "/portal",
  courses: "/portal/courses",
  vault: "/portal/resources",
  office: "/portal/office",
  calculators: "/portal/calculators",
  toolkit: "/portal/tools",
  studio: "/portal/studio",
  account: "/portal/account",
};

export function PortalLayout() {
  const { user, signOut } = useAuth();
  const { preview, setPreview } = useClientPreview();
  const navigate = useNavigate();
  const location = useLocation();
  const unlocked = hasAnyProgram(user?.programs);
  const isAdmin = isAdminEmail(user?.email);
  const coachMode = isAdmin && !preview;
  const [nav, setNav] = useState<NavSettings>(DEFAULT_NAV);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void fetchNavSettings().then(setNav);
    const onStorage = () => {
      void fetchNavSettings().then(setNav);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("bbb-nav-updated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bbb-nav-updated", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!coachMode && location.pathname.startsWith("/portal/emailing")) {
      navigate("/portal");
    }
  }, [coachMode, location.pathname, navigate]);

  function visible(id: NavTopicId) {
    // Studio only in Coach view
    if (id === "studio" && !coachMode) return false;
    // Admins can browse locked areas in Client view to preview them
    if (!unlocked && !isAdmin && id !== "home" && id !== "account") return false;
    return nav[id] !== false;
  }

  const groups = ["Learn", "Build", "Create", "You"] as const;

  function closeMenu() {
    setMenuOpen(false);
  }

  function setMode(mode: "coach" | "client") {
    const wantClient = mode === "client";
    setPreview(wantClient);
    closeMenu();
    if (
      wantClient &&
      (location.pathname.startsWith("/portal/studio") ||
        location.pathname.startsWith("/portal/emailing"))
    ) {
      navigate("/portal");
    }
  }

  const ownedLabel = preview
    ? "Client view — what buyers see"
    : coachMode
      ? "Coach view — edit everything"
      : user?.programs?.length === 1
        ? `Program: ${user.programs[0]}`
        : user?.programs?.length
          ? `${user.programs.length} programs unlocked`
          : "Free account · buy a program to unlock";

  const navBody = (
    <>
      <div className="portal__brand">
        <LogoLink />
      </div>
      <div className="portal__user">
        <p className="portal__hello">Hey {user?.name?.split(" ")[0] || "you"} ♡</p>
        <p className="portal__plan">{ownedLabel}</p>
      </div>

      {isAdmin && (
        <div className="portal__mode" role="group" aria-label="Coach or client view">
          <p className="portal__mode-label">View mode</p>
          <div className="portal__mode-toggle">
            <button
              type="button"
              className={`portal__mode-btn ${!preview ? "is-active" : ""}`}
              aria-pressed={!preview}
              onClick={() => setMode("coach")}
            >
              Coach view
            </button>
            <button
              type="button"
              className={`portal__mode-btn ${preview ? "is-active" : ""}`}
              aria-pressed={preview}
              onClick={() => setMode("client")}
            >
              Client view
            </button>
          </div>
          <p className="portal__mode-hint">
            {preview
              ? "Seeing the portal like a client. Switch to Coach to edit."
              : "Edit programs, pages, and what shows for clients."}
          </p>
        </div>
      )}

      {coachMode && (
        <details className="portal__coach-menu">
          <summary>Coach menu</summary>
          <nav className="portal__coach-links" aria-label="Coach pages" onClick={closeMenu}>
            <NavLink to="/portal" end>
              Home
            </NavLink>
            <NavLink to="/portal/courses">Courses</NavLink>
            <NavLink to="/portal/emailing">Emailing list</NavLink>
            <NavLink to="/portal/office">The Office</NavLink>
            <NavLink to="/portal/calculators">Calculators</NavLink>
            <NavLink to="/portal/tools">Toolkit</NavLink>
            <NavLink to="/portal/studio">Studio</NavLink>
          </nav>
        </details>
      )}

      <nav className="portal__nav" aria-label="Portal" onClick={closeMenu}>
        {groups.map((group) => {
          const items = NAV_META.filter(
            (m) => m.group === group && visible(m.id),
          );
          if (!items.length) return null;
          return (
            <div className="portal__nav-group" key={group}>
              <p className="portal__nav-label">{group}</p>
              {items.map((item) => (
                <NavLink
                  key={item.id}
                  to={PATHS[item.id]}
                  end={item.id === "home"}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="portal__side-foot">
        {!unlocked && !coachMode && (
          <Link
            className="btn btn--primary portal__upgrade"
            to="/programs"
            onClick={closeMenu}
          >
            Shop programs →
          </Link>
        )}
        {coachMode && (
          <Link
            className="btn btn--primary portal__upgrade"
            to="/portal/studio"
            onClick={closeMenu}
          >
            Open Studio →
          </Link>
        )}
        <button className="btn btn--ghost-ink" type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div
      className={`portal ${menuOpen ? "portal--menu-open" : ""} ${preview ? "portal--client" : coachMode ? "portal--coach" : ""}`}
    >
      <aside className="portal__side">{navBody}</aside>
      <div className="portal__main">
        <header className="portal__topbar">
          <button
            className="portal__menu-btn"
            type="button"
            aria-expanded={menuOpen}
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            Menu
          </button>
          <div>
            <p className="portal__topbar-kicker">
              {preview ? "Client view" : coachMode ? "Coach view" : "The Office"}
            </p>
            <p className="portal__topbar-title">
              {preview
                ? "Previewing what your clients see"
                : unlocked || coachMode
                  ? "Your laptop learning portal"
                  : "Buy a program to unlock"}
            </p>
          </div>
          <div className="portal__topbar-actions">
            {coachMode && visible("studio") && (
              <Link className="btn btn--ghost-ink" to="/portal/studio">
                Studio →
              </Link>
            )}
            {!unlocked && !coachMode && !isAdmin && (
              <Link className="btn btn--primary" to="/programs">
                Programs →
              </Link>
            )}
          </div>
        </header>
        {isAdmin && preview && (
          <div className="portal__client-banner" role="status">
            <p>
              <strong>Client view</strong> — this is what buyers see. Editing is
              off.
            </p>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => setMode("coach")}
            >
              Back to Coach view →
            </button>
          </div>
        )}
        <div className="portal__content">
          <Outlet />
        </div>
      </div>
      {menuOpen && (
        <div className="portal__drawer" role="dialog" aria-label="Portal menu">
          <button
            className="portal__drawer-close"
            type="button"
            onClick={closeMenu}
          >
            Close
          </button>
          {navBody}
        </div>
      )}
    </div>
  );
}
