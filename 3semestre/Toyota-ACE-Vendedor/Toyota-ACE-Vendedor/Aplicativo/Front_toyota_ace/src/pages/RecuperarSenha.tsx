import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import logoT from "@/assets/logoT.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccessibilityControls } from "@/components/AccessibilityControls";

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");

  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t("Digite seu e-mail"));
      return;
    }

    toast.success(t("Link de recuperação enviado para seu e-mail!"));

    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <div className="w-full min-h-screen bg-[url('https://mir-s3-cdn-cf.behance.net/project_modules/fs/c84ab249239255.56085275bc31a.png')] bg-center bg-cover flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
          <AccessibilityControls />
          <ThemeToggle />
      </div>

      {/* Card */}
      <div className="w-full max-w-md animate-fade-in backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-2xl shadow-black/40 p-8">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-16 h-16 flex items-center justify-center mb-1">
            <img
              src={logoT}
              alt={t("Toyota Logo")}
              className="w-24 h-24 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-white">
            {t("Recuperar Senha")}
          </h1>

          <p className="text-sm text-white/90">
            {t("Informe seu e-mail para receber o link de recuperação")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRecover} className="space-y-4">
          
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

          <Button type="submit" className="w-full">
            {t("Enviar link")}
          </Button>

          <p className="text-center text-white text-sm">
            {t("Lembrou sua senha?")}{" "}
            <Link
              to="/"
              className="text-primary hover:underline font-medium"
            >
              {t("Voltar para login")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RecuperarSenha;