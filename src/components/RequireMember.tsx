import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { canAccessContent } from "../lib/access";
import { isAdminEmail } from "../lib/admin";

/** Learning routes — need at least one purchased program (admins bypass). */
export function RequireMember({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace />;
  const admin = isAdminEmail(user.email);
  if (!canAccessContent(user.programs, { isAdmin: admin })) {
    return <Navigate to="/programs" replace />;
  }
  return children;
}
