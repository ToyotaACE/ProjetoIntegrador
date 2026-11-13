import { useEffect, useState } from "react";
import type { SVGProps } from "react";
import {
  Languages,
  Minus,
  Palette,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LANGUAGE_OPTIONS,
  isLanguage,
  useLanguage,
} from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const FONT_SCALES = [100, 112.5, 125, 137.5, 150];
const FONT_SCALE_KEY = "toyota-accessibility-font-scale";
const COLORBLIND_KEY = "toyota-accessibility-colorblind";

function MobileAccessibilityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" {...props}>
      <circle cx="256" cy="56" r="40" strokeLinejoin="round" strokeWidth="32" />
      <path
        d="M204.23 274.44c2.9-18.06 4.2-35.52-.5-47.59-4-10.38-12.7-16.19-23.2-20.15L88 176.76c-12-4-23.21-10.7-24-23.94-1-17 14-28 29-24 0 0 88 31.14 163 31.14s162-31 162-31c18-5 30 9 30 23.79 0 14.21-11 19.21-24 23.94l-88 31.91c-8 3-21 9-26 18.18-6 10.75-5 29.53-2.1 47.59l5.9 29.63 37.41 163.9c2.8 13.15-6.3 25.44-19.4 27.74S308 489 304.12 476.28l-37.56-115.93q-2.71-8.34-4.8-16.87L256 320l-5.3 21.65q-2.52 10.35-5.8 20.48L208 476.18c-4 12.85-14.5 21.75-27.6 19.46s-22.4-15.59-19.46-27.74l37.39-163.83Z"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

const readFontScale = () => {
  const savedScale = Number(localStorage.getItem(FONT_SCALE_KEY));
  return FONT_SCALES.includes(savedScale) ? savedScale : 100;
};

export function AccessibilityControls({ className }: { className?: string }) {
  const [fontScale, setFontScale] = useState(readFontScale);
  const [colorblindPalette, setColorblindPalette] = useState(
    () => localStorage.getItem(COLORBLIND_KEY) === "true"
  );
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${fontScale}%`;
    root.classList.toggle("accessibility-colorblind", colorblindPalette);
    localStorage.setItem(FONT_SCALE_KEY, String(fontScale));
    localStorage.setItem(COLORBLIND_KEY, String(colorblindPalette));
  }, [fontScale, colorblindPalette]);

  const changeFontScale = (direction: -1 | 1) => {
    setFontScale((currentScale) => {
      const currentIndex = FONT_SCALES.indexOf(currentScale);
      const nextIndex = Math.min(
        Math.max(currentIndex + direction, 0),
        FONT_SCALES.length - 1
      );
      return FONT_SCALES[nextIndex];
    });
  };

  const reset = () => {
    setFontScale(100);
    setColorblindPalette(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Abrir opções de acessibilidade")}
          title={t("Acessibilidade")}
          className={cn("text-foreground", className)}
        >
          <MobileAccessibilityIcon aria-hidden="true" className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">{t("Acessibilidade")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("Ajuste a leitura e as cores da interface.")}
            </p>
          </div>

          <section aria-labelledby="tamanho-texto-label" className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 id="tamanho-texto-label" className="text-sm font-medium">
                {t("Tamanho do texto")}
              </h3>
              <span aria-live="polite" className="text-xs text-muted-foreground">
                {fontScale}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("Diminuir tamanho do texto")}
                onClick={() => changeFontScale(-1)}
                disabled={fontScale === FONT_SCALES[0]}
              >
                <Minus aria-hidden="true" className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("Aumentar tamanho do texto")}
                onClick={() => changeFontScale(1)}
                disabled={fontScale === FONT_SCALES[FONT_SCALES.length - 1]}
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <Button
            type="button"
            variant={colorblindPalette ? "default" : "outline"}
            aria-pressed={colorblindPalette}
            className="w-full justify-start"
            onClick={() => setColorblindPalette((enabled) => !enabled)}
          >
            <Palette aria-hidden="true" className="mr-2 h-4 w-4" />
            {t("Paleta para daltonismo")}
          </Button>
          <p className="-mt-3 text-xs text-muted-foreground">
            {t("Ativa uma paleta azul e laranja que não depende de vermelho e verde.")}
          </p>

          <section aria-labelledby="idioma-aplicacao-label" className="space-y-2">
            <label
              id="idioma-aplicacao-label"
              htmlFor="idioma-aplicacao"
              className="text-sm font-medium"
            >
              {t("Idioma")}
            </label>
            <Select
              value={language}
              onValueChange={(value) => {
                if (isLanguage(value)) setLanguage(value);
              }}
            >
              <SelectTrigger id="idioma-aplicacao" aria-label={t("Idioma da aplicação")}>
                <Languages aria-hidden="true" className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={reset}
            disabled={fontScale === 100 && !colorblindPalette}
          >
            <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
            {t("Restaurar padrão")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
