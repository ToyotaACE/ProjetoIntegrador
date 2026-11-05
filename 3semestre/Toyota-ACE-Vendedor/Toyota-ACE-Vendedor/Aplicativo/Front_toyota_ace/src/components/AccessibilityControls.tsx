import { useEffect, useState } from "react";
import {
  Accessibility,
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

const FONT_SCALES = [100, 112.5, 125, 137.5, 150];
const FONT_SCALE_KEY = "toyota-accessibility-font-scale";
const COLORBLIND_KEY = "toyota-accessibility-colorblind";

const readFontScale = () => {
  const savedScale = Number(localStorage.getItem(FONT_SCALE_KEY));
  return FONT_SCALES.includes(savedScale) ? savedScale : 100;
};

export function AccessibilityControls() {
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
        >
          <Accessibility aria-hidden="true" className="h-5 w-5" />
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
