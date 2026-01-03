import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HorizonProvider } from "@/contexts/HorizonContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Onboarding } from "@/components/Onboarding";
import { useHorizonData } from "@/hooks/useHorizonData";
import Dashboard from "./pages/Dashboard";
import GoalsPage from "./pages/GoalsPage";
import TodosPage from "./pages/TodosPage";
import PeoplePage from "./pages/PeoplePage";
import PerksPage from "./pages/PerksPage";
import SettingsPage from "./pages/SettingsPage";
import SelfCarePage from "./pages/SelfCarePage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-horizon-warm via-background to-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useHorizonData();
  const location = useLocation();
  
  if (authLoading || (user && profileLoading)) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to onboarding if profile is incomplete (except if already on onboarding)
  const needsOnboarding = profile && !profile.onboarding_completed && !profile.name;
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isPasswordResetFlow =
    new URLSearchParams(location.search).get('reset') === 'true';

  if (loading) {
    return <LoadingSpinner />;
  }

  // Allow authenticated recovery sessions to stay on /auth?reset=true
  if (user && !isPasswordResetFlow) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/goals" element={
          <ProtectedRoute>
            <GoalsPage />
          </ProtectedRoute>
        } />
        <Route path="/todos" element={
          <ProtectedRoute>
            <TodosPage />
          </ProtectedRoute>
        } />
        <Route path="/self-care" element={
          <ProtectedRoute>
            <SelfCarePage />
          </ProtectedRoute>
        } />
        <Route path="/people" element={
          <ProtectedRoute>
            <PeoplePage />
          </ProtectedRoute>
        } />
        <Route path="/perks" element={
          <ProtectedRoute>
            <PerksPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding onComplete={() => window.location.href = '/'} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <HorizonProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </HorizonProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
