import { NavLink, Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogoLink } from "./Logo";
import { useAuth } from "../lib/auth";
import { hasAnyProgram } from "../lib/access";
import { isAdminEmail } from "../lib/admin";
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
  const unlocked = hasAnyProgram(user?.programs);
  const admin = isAdminEmail(user?.email);
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

  function visible(id: NavTopicId) {
    if (id === "studio" && !admin) return false;
    if (!unlocked && !admin && id !== "home" && id !== "account") return false;
    return nav[id] !== false;
  }

  const groups = ["Learn", "Build", "Create", "You"] as const;

  function closeMenu() {
    setMenuOpen(false);
  }

  const ownedLabel =
    user?.programs?.length === 1
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
        {!unlocked && (
          <Link
            className="btn btn--primary portal__upgrade"
            to="/programs"
            onClick={closeMenu}
          >
            Shop programs →
          </Link>
        )}
        <button className="btn btn--ghost-ink" type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className={`portal ${menuOpen ? "portal--menu-open" : ""}`}>
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
            <p className="portal__topbar-kicker">The Office</p>
            <p className="portal__topbar-title">
              {unlocked || admin
                ? "Your laptop learning portal"
                : "Buy a program to unlock"}
            </p>
          </div>
          <div className="portal__topbar-actions">
            {admin && visible("studio") && (
              <Link className="btn btn--ghost-ink" to="/portal/studio">
                Studio →
              </Link>
            )}
            {!unlocked && !admin && (
              <Link className="btn btn--primary" to="/programs">
                Programs →
              </Link>
            )}
          </div>
        </header>
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
