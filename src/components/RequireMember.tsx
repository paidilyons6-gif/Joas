import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { canAccessContent } from "../lib/access";
import { isAdminEmail } from "../lib/admin";
import { useClientPreview } from "../lib/clientPreview";

/**
 * Learning routes — need a purchased program.
 * Admins always reach the page (even in View as client) so they can preview
 * locked UI; child pages still enforce locks when preview is on.
 */
export function RequireMember({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { preview } = useClientPreview();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace />;

  const isAdmin = isAdminEmail(user.email);
  // Let admins into the route so "View as client" can show locks in place.
  if (isAdmin) return children;

  if (!canAccessContent(user.programs, { isAdmin: false })) {
    return <Navigate to="/programs" replace />;
  }
  void preview;
  return children;
}
