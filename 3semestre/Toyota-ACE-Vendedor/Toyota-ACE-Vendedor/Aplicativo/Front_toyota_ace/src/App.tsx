import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

import Login from "./pages/Login";
import RecuperarSenha from "./pages/RecuperarSenha";

import BranchSelect from "./pages/BranchSelect";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Clients from "./pages/Clients";
import Schedule from "./pages/Schedule";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";
import {
  NewVehicleOrder,
  VehicleOrderDetail,
  VehicleOrdersHome,
  VehicleOrdersList,
} from "./pages/VehicleOrders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <AppProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/recuperar" element={<RecuperarSenha />} />

                <Route path="/filial" element={<BranchSelect />} />

                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/veiculos" element={<Vehicles />} />
                  <Route path="/pedidos" element={<VehicleOrdersHome />} />
                  <Route path="/pedidos/novo" element={<NewVehicleOrder />} />
                  <Route path="/pedidos/meus" element={<VehicleOrdersList />} />
                  <Route path="/pedidos/:id" element={<VehicleOrderDetail />} />
                  <Route path="/clientes" element={<Clients />} />
                  <Route path="/agenda" element={<Schedule />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AppProvider>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;