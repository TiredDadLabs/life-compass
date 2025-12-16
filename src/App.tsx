import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HorizonProvider } from "@/contexts/HorizonContext";
import { Onboarding } from "@/components/Onboarding";
import Dashboard from "./pages/Dashboard";
import GoalsPage from "./pages/GoalsPage";
import PeoplePage from "./pages/PeoplePage";
import PerksPage from "./pages/PerksPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // For demo purposes, we skip onboarding by default
  // Set to true to see the onboarding flow
  
  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/perks" element={<PerksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/onboarding" element={<Onboarding onComplete={() => window.location.href = '/'} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HorizonProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </HorizonProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
