import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { SiteLayout } from "./components/SiteLayout";
import { PortalLayout } from "./components/PortalLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./pages/HomePage";
import { PricingPage } from "./pages/PricingPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { PrivacyPage, TermsPage } from "./pages/LegalPages";
import { PortalHome } from "./pages/portal/PortalHome";
import { CoursesPage } from "./pages/portal/CoursesPage";
import { TrackPage } from "./pages/portal/TrackPage";
import { LessonPage } from "./pages/portal/LessonPage";
import { ToolsPage } from "./pages/portal/ToolsPage";
import { ToolPage } from "./pages/portal/ToolPage";
import { CalculatorsPage } from "./pages/portal/CalculatorsPage";
import { CalculatorPage } from "./pages/portal/CalculatorPage";
import { ResourcesPage } from "./pages/portal/ResourcesPage";
import { AccountPage } from "./pages/portal/AccountPage";
import { StudioPage, StudioEditorPage } from "./pages/portal/StudioPage";
import { OfficePage } from "./pages/portal/OfficePage";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
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
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:trackId" element={<TrackPage />} />
              <Route path="courses/:trackId/:lessonId" element={<LessonPage />} />
              <Route path="tools" element={<ToolsPage />} />
              <Route path="tools/:toolId" element={<ToolPage />} />
              <Route path="calculators" element={<CalculatorsPage />} />
              <Route path="calculators/:calcId" element={<CalculatorPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="office" element={<OfficePage />} />
              <Route path="village" element={<Navigate to="/portal/office" replace />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="studio" element={<StudioPage />} />
              <Route path="studio/:trackId" element={<StudioEditorPage />} />
              <Route path="training" element={<Navigate to="/portal/courses" replace />} />
              <Route path="training/:moduleId" element={<Navigate to="/portal/courses" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
