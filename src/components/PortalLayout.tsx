import { NavLink, Outlet } from "react-router-dom";
import { LogoLink } from "./Logo";
import { useAuth } from "../lib/auth";

export function PortalLayout() {
  const { user, signOut } = useAuth();
  const member = user && user.plan !== "none";

  return (
    <div className="portal">
      <aside className="portal__side">
        <LogoLink />
        <p className="portal__hello">Hey {user?.name?.split(" ")[0] || "you"} ♡</p>
        <p className="portal__plan">
          {member
            ? user?.plan === "annual"
              ? "Founders Year member"
              : "Monthly member"
            : "Free account · upgrade to unlock"}
        </p>
        <nav className="portal__nav" aria-label="Portal">
          <NavLink to="/portal" end>
            Home
          </NavLink>
          <NavLink to="/portal/training">Training</NavLink>
          <NavLink to="/portal/resources">Resources</NavLink>
          <NavLink to="/portal/account">Account</NavLink>
        </nav>
        <button className="btn btn--ghost-ink portal__signout" type="button" onClick={() => void signOut()}>
          Log out
        </button>
      </aside>
      <main className="portal__main">
        <Outlet />
      </main>
    </div>
  );
}
