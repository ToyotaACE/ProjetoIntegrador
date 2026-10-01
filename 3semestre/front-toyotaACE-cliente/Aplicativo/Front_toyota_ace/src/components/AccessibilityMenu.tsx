import { useEffect, useState } from "react";
import { Accessibility, Languages, Minus, Plus, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

type ColorFilter = "none" | "high-contrast" | "protanopia" | "deuteranopia" | "tritanopia";

const copy = {
  "pt-BR": {
    title: "Acessibilidade", read: "Ler página", stop: "Parar leitura", font: "Tamanho do texto",
    colors: "Filtro de cores", language: "Idioma", reset: "Restaurar preferências",
    filters: ["Sem filtro", "Alto contraste", "Protanopia", "Deuteranopia", "Tritanopia"],
  },
  "en-US": {
    title: "Accessibility", read: "Read page", stop: "Stop reading", font: "Text size",
    colors: "Color filter", language: "Language", reset: "Reset preferences",
    filters: ["No filter", "High contrast", "Protanopia", "Deuteranopia", "Tritanopia"],
  },
  "es-ES": {
    title: "Accesibilidad", read: "Leer página", stop: "Detener lectura", font: "Tamaño del texto",
    colors: "Filtro de color", language: "Idioma", reset: "Restablecer preferencias",
    filters: ["Sin filtro", "Alto contraste", "Protanopía", "Deuteranopía", "Tritanopía"],
  },
} as const;

const filterOptions: ColorFilter[] = ["none", "high-contrast", "protanopia", "deuteranopia", "tritanopia"];

function readPreference<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [fontScale, setFontScale] = useState(() => readPreference("a11y-font-scale", 100));
  const [colorFilter, setColorFilter] = useState<ColorFilter>(() => readPreference("a11y-color-filter", "none"));
  const { language, setLanguage } = useLanguage();
  const [speaking, setSpeaking] = useState(false);
  const text = copy[language];

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    localStorage.setItem("a11y-font-scale", JSON.stringify(fontScale));
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.dataset.colorFilter = colorFilter;
    localStorage.setItem("a11y-color-filter", JSON.stringify(colorFilter));
  }, [colorFilter]);

  useEffect(() => {
    const stop = () => {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    };
    window.addEventListener("beforeunload", stop);
    return () => {
      window.removeEventListener("beforeunload", stop);
      stop();
    };
  }, []);

  const readPage = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const content = document.querySelector("main")?.innerText || document.body.innerText;
    const utterance = new SpeechSynthesisUtterance(content.replace(/\s+/g, " ").trim());
    utterance.lang = language;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const reset = () => {
    setFontScale(100);
    setColorFilter("none");
    setLanguage("pt-BR");
    stopReading();
  };

  return (
    <aside className="fixed bottom-6 right-28 z-[100]" aria-label={text.title}>
      {open && (
        <div className="mb-3 w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl" role="dialog" aria-label={text.title}>
          <div className="mb-4 flex items-center gap-2 text-base font-bold">
            <Accessibility className="h-5 w-5" aria-hidden="true" />
            {text.title}
          </div>

          <button type="button" onClick={speaking ? stopReading : readPage} className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {speaking ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
            {speaking ? text.stop : text.read}
          </button>

          <section className="mb-4" aria-label={text.font}>
            <p className="mb-2 text-sm font-medium">{text.font}: {fontScale}%</p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Diminuir tamanho do texto" onClick={() => setFontScale((value) => Math.max(85, value - 10))} className="rounded-md border p-2 hover:bg-accent"><Minus className="h-4 w-4" /></button>
              <input className="w-full accent-black" type="range" min="85" max="130" step="5" value={fontScale} onChange={(event) => setFontScale(Number(event.target.value))} aria-label={text.font} />
              <button type="button" aria-label="Aumentar tamanho do texto" onClick={() => setFontScale((value) => Math.min(130, value + 10))} className="rounded-md border p-2 hover:bg-accent"><Plus className="h-4 w-4" /></button>
            </div>
          </section>

          <label className="mb-4 block text-sm font-medium">
            {text.colors}
            <select value={colorFilter} onChange={(event) => setColorFilter(event.target.value as ColorFilter)} className="mt-1 w-full rounded-md border bg-background p-2 text-sm">
              {filterOptions.map((filter, index) => <option key={filter} value={filter}>{text.filters[index]}</option>)}
            </select>
          </label>

          <label className="mb-4 block text-sm font-medium">
            <span className="flex items-center gap-2"><Languages className="h-4 w-4" aria-hidden="true" />{text.language}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="mt-1 w-full rounded-md border bg-background p-2 text-sm">
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English</option>
              <option value="es-ES">Español</option>
            </select>
          </label>

          <button type="button" onClick={reset} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />{text.reset}
          </button>
        </div>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={text.title} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <Accessibility className="h-6 w-6" aria-hidden="true" />
      </button>
    </aside>
  );
}
