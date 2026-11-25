import { useEffect, useRef, useState } from "react";
import { Accessibility, Languages, Minus, Plus, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { findSpeechVoice, getSpeechVoices } from "@/lib/speech";

type ColorFilter = "none" | "high-contrast" | "protanopia" | "deuteranopia" | "tritanopia";

const copy = {
  "pt-BR": {
    title: "Acessibilidade", read: "Ler página", stop: "Parar leitura", font: "Tamanho do texto",
    colors: "Filtro de cores", language: "Idioma", reset: "Restaurar preferências",
    loading: "Carregando voz...", unavailable: "Não há voz instalada para este idioma. Instale uma voz compatível nas configurações de leitura do navegador ou sistema.",
    unsupported: "A leitura por voz não é compatível com este navegador.", empty: "Não há texto para leitura nesta página.", failed: "Não foi possível iniciar a leitura por voz.",
    filters: ["Sem filtro", "Alto contraste", "Protanopia", "Deuteranopia", "Tritanopia"],
  },
  "en-US": {
    title: "Accessibility", read: "Read page", stop: "Stop reading", font: "Text size",
    colors: "Color filter", language: "Language", reset: "Reset preferences",
    loading: "Loading voice...", unavailable: "No voice is installed for this language. Install a compatible voice in your browser or system speech settings.",
    unsupported: "Text-to-speech is not supported by this browser.", empty: "There is no text to read on this page.", failed: "Could not start text-to-speech.",
    filters: ["No filter", "High contrast", "Protanopia", "Deuteranopia", "Tritanopia"],
  },
  "es-ES": {
    title: "Accesibilidad", read: "Leer página", stop: "Detener lectura", font: "Tamaño del texto",
    colors: "Filtro de color", language: "Idioma", reset: "Restablecer preferencias",
    loading: "Cargando voz...", unavailable: "No hay una voz instalada para este idioma. Instala una voz compatible en los ajustes de voz del navegador o del sistema.",
    unsupported: "Este navegador no es compatible con la lectura por voz.", empty: "No hay texto para leer en esta página.", failed: "No se pudo iniciar la lectura por voz.",
    filters: ["Sin filtro", "Alto contraste", "Protanopía", "Deuteranopía", "Tritanopía"],
  },
  "ja-JP": {
    title: "アクセシビリティ", read: "ページを読み上げる", stop: "読み上げを停止", font: "文字サイズ",
    colors: "色覚フィルター", language: "言語", reset: "設定をリセット",
    loading: "音声を読み込み中...", unavailable: "この言語の音声がインストールされていません。ブラウザーまたはシステムの読み上げ設定で対応する音声をインストールしてください。",
    unsupported: "このブラウザーは音声読み上げに対応していません。", empty: "このページに読み上げるテキストがありません。", failed: "音声読み上げを開始できませんでした。",
    filters: ["フィルターなし", "高コントラスト", "1型色覚", "2型色覚", "3型色覚"],
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
  const [preparing, setPreparing] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const speechRequest = useRef(0);
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
    const cancelSpeech = () => {
      speechRequest.current += 1;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
    window.addEventListener("beforeunload", cancelSpeech);
    return () => {
      window.removeEventListener("beforeunload", cancelSpeech);
      cancelSpeech();
    };
  }, []);

  const stopReading = () => {
    speechRequest.current += 1;
    setPreparing(false);
    setSpeaking(false);
    setSpeechError("");
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  const readPage = async () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setSpeechError(text.unsupported);
      return;
    }

    stopReading();
    const requestId = ++speechRequest.current;
    const content = (document.querySelector("main")?.innerText || document.body.innerText)
      .replace(/\s+/g, " ")
      .trim();
    if (!content) {
      setSpeechError(text.empty);
      return;
    }

    setSpeechError("");
    setPreparing(true);
    try {
      const voices = await getSpeechVoices(window.speechSynthesis, language);
      if (requestId !== speechRequest.current) return;

      const voice = findSpeechVoice(voices, language);
      if (!voice) {
        setSpeechError(text.unavailable);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(content);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.95;
      utterance.onend = () => {
        if (requestId === speechRequest.current) setSpeaking(false);
      };
      utterance.onerror = () => {
        if (requestId !== speechRequest.current) return;
        setSpeaking(false);
        setSpeechError(text.failed);
      };
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      if (requestId !== speechRequest.current) return;
      console.error("Falha ao carregar ou iniciar a voz selecionada.", error);
      setSpeechError(text.failed);
    } finally {
      if (requestId === speechRequest.current) setPreparing(false);
    }
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

          <button type="button" onClick={speaking || preparing ? stopReading : readPage} className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {speaking || preparing ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
            {preparing ? text.loading : speaking ? text.stop : text.read}
          </button>
          {speechError && <p className="mb-4 text-sm text-destructive" role="status">{speechError}</p>}

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
            <select value={language} onChange={(event) => { stopReading(); setLanguage(event.target.value as Language); }} className="mt-1 w-full rounded-md border bg-background p-2 text-sm">
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English</option>
              <option value="es-ES">Español</option>
              <option value="ja-JP">日本語</option>
            </select>
          </label>

          <button type="button" onClick={reset} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />{text.reset}
          </button>
        </div>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={text.title} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <svg viewBox="0 0 512 512" className="h-6 w-6 fill-current" aria-hidden="true">
          <path d="M256,112a56,56,0,1,1,56-56A56.06,56.06,0,0,1,256,112Z" />
          <path d="M432,112.8l-.45.12h0l-.42.13c-1,.28-2,.58-3,.89-18.61,5.46-108.93,30.92-172.56,30.92-59.13,0-141.28-22-167.56-29.47a73.79,73.79,0,0,0-8-2.58c-19-5-32,14.3-32,31.94,0,17.47,15.7,25.79,31.55,31.76v.28l95.22,29.74c9.73,3.73,12.33,7.54,13.6,10.84,4.13,10.59.83,31.56-.34,38.88l-5.8,45L150.05,477.44q-.15.72-.27,1.47l-.23,1.27h0c-2.32,16.15,9.54,31.82,32,31.82,19.6,0,28.25-13.53,32-31.94h0s28-157.57,42-157.57,42.84,157.57,42.84,157.57h0c3.75,18.41,12.4,31.94,32,31.94,22.52,0,34.38-15.74,32-31.94-.21-1.38-.46-2.74-.76-4.06L329,301.27l-5.79-45c-4.19-26.21-.82-34.87.32-36.9a1.09,1.09,0,0,0,.08-.15c1.08-2,6-6.48,17.48-10.79l89.28-31.21a16.9,16.9,0,0,0,1.62-.52c16-6,32-14.3,32-31.93S451,107.81,432,112.8Z" />
        </svg>
      </button>
    </aside>
  );
}
