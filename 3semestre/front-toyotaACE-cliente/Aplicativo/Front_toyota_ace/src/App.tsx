import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import PageTranslation from "@/components/PageTranslation";
import RouteAppearance from "@/components/RouteAppearance";

import AppLayout from "@/components/AppLayout";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import VehiclePage from "@/pages/VehiclePage";
import FinancingPage from "@/pages/FinancingPage";
import SchedulingPage from "@/pages/SchedulingPage";
import ProfilePage from "@/pages/ProfilePage";
import ShopPage from "@/pages/ShopPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AccessibilityMenu />
          <PageTranslation />

          <BrowserRouter>
            <RouteAppearance />
            <Routes>
              <Route path="/" element={<Navigate to="/apresentacao" replace />} />

              <Route path="/apresentacao" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />
              <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />

              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/veiculo" element={<VehiclePage />} />
                <Route path="/financiamento" element={<FinancingPage />} />
                <Route path="/agendamento" element={<SchedulingPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
