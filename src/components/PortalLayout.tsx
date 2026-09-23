import { NavLink, Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogoLink } from "./Logo";
import { useAuth } from "../lib/auth";
import { isMember } from "../lib/access";
import { isAdminEmail } from "../lib/admin";
import {
  DEFAULT_NAV,
  NAV_META,
  studioStore,
  type NavSettings,
  type NavTopicId,
} from "../lib/studio";

const PATHS: Record<NavTopicId, string> = {
  home: "/portal",
  courses: "/portal/courses",
  vault: "/portal/resources",
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

  useEffect(() => {
    setNav(studioStore.getNavSettings());
    const onStorage = () => setNav(studioStore.getNavSettings());
    window.addEventListener("storage", onStorage);
    window.addEventListener("bbb-nav-updated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bbb-nav-updated", onStorage);
    };
  }, []);

  function visible(id: NavTopicId) {
    if (id === "studio" && !admin) return false;
    return nav[id] !== false;
  }

  const groups = ["Learn", "Build", "Create", "You"] as const;

  return (
    <div className="portal">
      <aside className="portal__side">
        <div className="portal__brand">
          <LogoLink />
          <p className="portal__tag">Learning village</p>
        </div>
        <div className="portal__user">
          <p className="portal__hello">Hey {user?.name?.split(" ")[0] || "you"} ♡</p>
          <p className="portal__plan">
            {member
              ? user?.plan === "annual"
                ? "Founders Year member"
                : "Monthly member"
              : "Free account · upgrade to unlock"}
          </p>
        </div>
        <nav className="portal__nav" aria-label="Portal">
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
            <Link className="btn btn--primary portal__upgrade" to="/pricing">
              Upgrade →
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
      </aside>
      <div className="portal__workspace">
        <header className="portal__topbar">
          <div>
            <p className="portal__topbar-kicker">Business by Becca</p>
            <p className="portal__topbar-title">Your laptop learning portal</p>
          </div>
          <div className="portal__topbar-actions">
            {admin && visible("studio") && (
              <Link className="btn btn--primary" to="/portal/studio">
                Edit programs →
              </Link>
            )}
            {visible("courses") && (
              <Link className="btn btn--ghost-ink" to="/portal/courses">
                Browse courses
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
