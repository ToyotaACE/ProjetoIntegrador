import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import logoT from "@/assets/logoT.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccessibilityControls } from "@/components/AccessibilityControls";

const Login = () => {
  const [email, setEmail] = useState("vendedor@toyota.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAppContext();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t("Preencha todos os campos"));
      return;
    }

    try {
      setLoading(true);

      const success = await login(email, password);

      if (success) {
        toast.success(t("Login realizado com sucesso!"));
        navigate("/filial");
      } else {
        toast.error(t("E-mail ou senha inválidos"));
      }
    } catch {
      toast.error(t("Não foi possível conectar ao servidor"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[url('https://mir-s3-cdn-cf.behance.net/project_modules/fs/c84ab249239255.56085275bc31a.png')] bg-center bg-cover flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
          <AccessibilityControls />
          <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-fade-in backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-2xl shadow-black/40 p-8">
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-16 h-16 flex items-center justify-center mb-1">
            <img
              src={logoT}
              alt={t("Toyota Logo")}
              className="w-24 h-24 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-white">{t("ACE Vendedor")}</h1>

          <p className="text-sm text-white/90">{t("Toyota Sales System")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              {t("E-mail")}
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/80"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              {t("Senha")}
            </Label>

            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/80"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("Entrando...") : t("Entrar")}
          </Button>

          
        </form>
      </div>
    </div>
  );
};

export default Login;