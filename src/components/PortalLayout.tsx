import { NavLink, Outlet, Link } from "react-router-dom";
import { LogoLink } from "./Logo";
import { useAuth } from "../lib/auth";
import { isMember } from "../lib/access";
import { isAdminEmail } from "../lib/admin";

export function PortalLayout() {
  const { user, signOut } = useAuth();
  const member = isMember(user?.plan);
  const admin = isAdminEmail(user?.email);

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
          <p className="portal__nav-label">Learn</p>
          <NavLink to="/portal" end>
            Home
          </NavLink>
          <NavLink to="/portal/courses">Courses</NavLink>
          <NavLink to="/portal/resources">Vault</NavLink>
          <p className="portal__nav-label">Build</p>
          <NavLink to="/portal/calculators">Calculators</NavLink>
          <NavLink to="/portal/tools">Toolkit</NavLink>
          {admin && (
            <>
              <p className="portal__nav-label">Create</p>
              <NavLink to="/portal/studio">Studio</NavLink>
            </>
          )}
          <p className="portal__nav-label">You</p>
          <NavLink to="/portal/account">Account</NavLink>
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
            {admin && (
              <Link className="btn btn--primary" to="/portal/studio">
                Create course →
              </Link>
            )}
            <Link className="btn btn--ghost-ink" to="/portal/courses">
              Browse courses
            </Link>
          </div>
        </header>
        <main className="portal__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
