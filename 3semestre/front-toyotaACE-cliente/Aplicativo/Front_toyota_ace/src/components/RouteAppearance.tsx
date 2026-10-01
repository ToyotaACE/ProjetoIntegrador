import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "@/styles/pages/chatbot.css";
import "@/styles/pages/dashboard.css";
import "@/styles/pages/financing.css";
import "@/styles/pages/forgot-password.css";
import "@/styles/pages/home.css";
import "@/styles/pages/landing.css";
import "@/styles/pages/login.css";
import "@/styles/pages/not-found.css";
import "@/styles/pages/profile.css";
import "@/styles/pages/register.css";
import "@/styles/pages/scheduling.css";
import "@/styles/pages/shop.css";
import "@/styles/pages/vehicle.css";

const screenNames: Record<string, string> = {
  "/": "home", "/apresentacao": "landing", "/login": "login", "/cadastro": "register",
  "/esqueci-senha": "forgot-password", "/dashboard": "dashboard", "/veiculo": "vehicle",
  "/financiamento": "financing", "/agendamento": "scheduling", "/shop": "shop", "/perfil": "profile",
};

export default function RouteAppearance() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.body.dataset.screen = screenNames[pathname] || "not-found";
  }, [pathname]);
  return null;
}
