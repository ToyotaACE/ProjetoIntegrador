import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type Language = "pt-BR" | "en-US" | "es-ES";

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void };
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try { return JSON.parse(localStorage.getItem("a11y-language") || '"pt-BR"'); } catch { return "pt-BR"; }
  });

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("a11y-language", JSON.stringify(language));
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage deve ser usado dentro de LanguageProvider");
  return context;
}
