import { NavLink, Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogoLink } from "./Logo";
import { useAuth } from "../lib/auth";
import { isMember } from "../lib/access";
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
  const member = isMember(user?.plan);
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
    // Free accounts: only Home + Account (content stays locked until membership)
    if (!member && !admin && id !== "home" && id !== "account") return false;
    return nav[id] !== false;
  }

  const groups = ["Learn", "Build", "Create", "You"] as const;

  function closeMenu() {
    setMenuOpen(false);
  }

  const navBody = (
    <>
      <div className="portal__brand">
        <LogoLink />
        <p className="portal__tag">The Office</p>
      </div>
      <div className="portal__user">
        <p className="portal__hello">Hey {user?.name?.split(" ")[0] || "you"} ♡</p>
        <p className="portal__plan">
          {member
            ? user?.plan === "annual"
              ? "BodiesByBecca yearly"
              : "BodiesByBecca member"
            : "Free account · content locked"}
        </p>
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
        {!member && (
          <Link className="btn btn--primary portal__upgrade" to="/pricing" onClick={closeMenu}>
            BodiesByBecca →
          </Link>
        )}
        <button
          className="btn btn--ghost-ink portal__signout"
          type="button"
          onClick={() => void signOut()}
        >
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className={`portal ${menuOpen ? "portal--menu-open" : ""}`}>
      <button
        className="portal__menu-btn"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="portal-side"
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? "Close menu" : "Menu"}
      </button>
      {menuOpen && (
        <button
          className="portal__backdrop"
          type="button"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}
      <aside className="portal__side" id="portal-side">
        {navBody}
      </aside>
      <div className="portal__workspace">
        <header className="portal__topbar">
          <div>
            <p className="portal__topbar-kicker">Business by Becca</p>
            <p className="portal__topbar-title">
              {member || admin ? "Your laptop learning portal" : "Membership required to unlock"}
            </p>
          </div>
          <div className="portal__topbar-actions">
            {admin && visible("studio") && (
              <Link className="btn btn--primary" to="/portal/studio">
                Edit programs →
              </Link>
            )}
            {member && visible("courses") && (
              <Link className="btn btn--ghost-ink" to="/portal/courses">
                Browse courses
              </Link>
            )}
            {!member && !admin && (
              <Link className="btn btn--primary" to="/pricing">
                Get membership →
              </Link>
            )}
          </div>
        </header>
        <main className="portal__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
