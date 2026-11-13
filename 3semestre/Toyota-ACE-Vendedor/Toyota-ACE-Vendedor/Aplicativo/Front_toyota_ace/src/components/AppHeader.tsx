import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const AppHeader = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/apresentacao"); // 🔥 manda pra landing
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6">
      
      <div className="flex items-center gap-3">
        <span className="text-primary font-bold text-lg tracking-tight">
          TOYOTA
        </span>
        <span className="hidden sm:inline text-muted-foreground text-sm">
          Toyota ACE
        </span>
      </div>

      <div className="flex items-center gap-2">
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
          className="text-foreground hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {user && (
          <>
            <span className="hidden md:inline text-sm text-muted-foreground">
              {user?.name || "Usuário"}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout} // ✅ aqui
              className="text-muted-foreground hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}

      </div>
    </header>
  );
};

export default AppHeader;
