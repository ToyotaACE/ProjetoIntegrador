import { useNavigate } from "react-router-dom";
import { branches } from "@/lib/mock-data";
import { useAppContext } from "@/contexts/AppContext";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccessibilityControls } from "@/components/AccessibilityControls";

const BranchSelect = () => {
  const navigate = useNavigate();
  const { selectBranch } = useAppContext();
  const { t } = useLanguage();

  const handleSelect = (name: string) => {
    selectBranch(name);
    toast.success(t("Filial {name} selecionada", { name }));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <AccessibilityControls />
      </div>
      <div className="w-full max-w-lg animate-reveal-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground mx-auto mb-4">      
  <img 
    src="/toyota_logo.png" 
    alt={t("Logo Toyota")}
    className="w-full h-full object-contain"
  />
</div>
          <h1 className="text-xl font-semibold text-balance">{t("Selecione sua filial")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("Escolha a unidade para iniciar o dia")}</p>
        </div>
        <div className="space-y-3">
          {branches.map((branch, i) => (
            <button
              key={branch.id}
              onClick={() => handleSelect(branch.name)}
              className={`w-full text-left p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98] group animate-reveal-up delay-${i + 1}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-sm">{branch.name}</p>
                  <p className="text-xs text-muted-foreground">{branch.address}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BranchSelect;
