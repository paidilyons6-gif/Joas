import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { SiteLayout } from "./components/SiteLayout";
import { PortalLayout } from "./components/PortalLayout";
import { HomePage } from "./pages/HomePage";
import { PricingPage } from "./pages/PricingPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { PortalHome } from "./pages/portal/PortalHome";
import { TrainingPage } from "./pages/portal/TrainingPage";
import { ModulePage } from "./pages/portal/ModulePage";
import { ResourcesPage } from "./pages/portal/ResourcesPage";
import { AccountPage } from "./pages/portal/AccountPage";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
          </Route>

          <Route
            path="/portal"
            element={
              <RequireAuth>
                <PortalLayout />
              </RequireAuth>
            }
          >
            <Route index element={<PortalHome />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="training/:moduleId" element={<ModulePage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
