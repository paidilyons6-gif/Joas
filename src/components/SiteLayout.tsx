import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogoLink } from "./Logo";
import { useAuth } from "../lib/auth";

export function SiteLayout() {
  const { user, mode } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="site">
      <header className={`nav ${isHome ? "nav--overlay" : "nav--solid"}`}>
        <LogoLink variant={isHome ? "light" : "default"} />
        <nav className="nav__links" aria-label="Primary">
          <NavLink to="/programs">Programs</NavLink>
          {user ? (
            <Link className="nav__cta" to="/portal">
              Open portal →
            </Link>
          ) : (
            <>
              <NavLink to="/sign-in">Log in</NavLink>
              <Link className="nav__cta" to="/sign-up">
                Let&apos;s do this →
              </Link>
            </>
          )}
        </nav>
      </header>

      {mode === "demo" && (
        <div className="demo-banner" role="status">
          Demo mode — accounts work on this device. Buy a program to unlock
          portal content; Becky manages products in Studio.
        </div>
      )}

      <Outlet />

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__top">
            <div>
              <LogoLink variant="light" />
              <p className="footer__tag">
                The Office · Build the damn business.
              </p>
            </div>
            <nav className="footer__nav" aria-label="Footer">
              <Link to="/programs">Programs</Link>
              <Link to="/sign-up">Join</Link>
              <Link to="/portal">Portal</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </nav>
          </div>
          <p className="footer__meta">
            From the world of Bodies by Becca · Built for girls with bigger
            plans ♡
          </p>
        </div>
      </footer>
    </div>
  );
}
