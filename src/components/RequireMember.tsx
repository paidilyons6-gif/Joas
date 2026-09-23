import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { canAccessContent } from "../lib/access";
import { isAdminEmail } from "../lib/admin";

/** Portal learning routes — free accounts must subscribe first. */
export function RequireMember({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace />;
  const admin = isAdminEmail(user.email);
  if (!canAccessContent(user.plan, { isAdmin: admin })) {
    return <Navigate to="/pricing" replace />;
  }
  return children;
}
