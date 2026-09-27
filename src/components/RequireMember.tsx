import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { canAccessContent } from "../lib/access";
import { isAdminEmail } from "../lib/admin";
import { useClientPreview } from "../lib/clientPreview";

/** Learning routes — need at least one purchased program (admins bypass unless View as client). */
export function RequireMember({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { preview } = useClientPreview();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace />;
  const admin = isAdminEmail(user.email) && !preview;
  if (!canAccessContent(user.programs, { isAdmin: admin })) {
    return <Navigate to="/programs" replace />;
  }
  return children;
}
