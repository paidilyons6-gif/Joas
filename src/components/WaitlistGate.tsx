import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminEmail } from "../lib/admin";
import { useAuth } from "../lib/auth";
import { isWaitlistMode, useWaitlistBypass } from "../lib/waitlist";
import { WaitlistPage } from "../pages/WaitlistPage";

const OPEN_PATHS = new Set([
  "/privacy",
  "/terms",
  "/enter",
  "/sign-in", // Becca can sign in → admin bypasses the gate
]);

/** Blocks the public site behind the email waitlist until launch. */
export function WaitlistGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { bypassed } = useWaitlistBypass();

  if (!isWaitlistMode()) return children;

  if (OPEN_PATHS.has(location.pathname)) return children;

  if (loading) return <div className="loading-screen">Loading…</div>;

  const admin = isAdminEmail(user?.email);
  if (bypassed || admin) return children;

  // Deep links → waitlist home (keep privacy/terms/enter open above)
  if (location.pathname !== "/") {
    return <Navigate to="/" replace />;
  }

  return <WaitlistPage />;
}
