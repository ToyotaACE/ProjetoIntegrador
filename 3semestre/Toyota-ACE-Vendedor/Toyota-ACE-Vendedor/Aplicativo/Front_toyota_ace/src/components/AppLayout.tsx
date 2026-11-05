import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccessibilityControls } from "@/components/AccessibilityControls";
import { Outlet } from "react-router-dom";
import ChatbotScreen from "@/pages/ChatbotScreen";
import { useLanguage } from "@/contexts/LanguageContext";

export function AppLayout() {
  const { t } = useLanguage();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 shrink-0">
            <SidebarTrigger />

            <span className="ml-3 text-sm text-muted-foreground">
              {t("Toyota ACE Vendedor")}
            </span>

            <div className="ml-auto flex items-center gap-1">
              <AccessibilityControls />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>

        <ChatbotScreen />
      </div>
    </SidebarProvider>
  );
}