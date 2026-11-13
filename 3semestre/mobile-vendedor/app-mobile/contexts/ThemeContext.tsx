import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type ThemeColors = {
  background: string;
  sidebar: string;
  card: string;
  cardSoft: string;
  box: string;
  input: string;
  border: string;
  text: string;
  subtext: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  success: string;
  danger: string;
};

type ThemeContextData = {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  fontScale: number;
  changeFontScale: (direction: -1 | 1) => void;
  colorblindPalette: boolean;
  toggleColorblindPalette: () => Promise<void>;
  resetAccessibility: () => Promise<void>;
};

const darkColors: ThemeColors = {
  background: "#0B0B0B",
  sidebar: "#111111",
  card: "#171717",
  cardSoft: "#1D1D1F",
  box: "#222222",
  input: "#141414",
  border: "#2A2A2A",
  text: "#FFFFFF",
  subtext: "#9CA3AF",
  primary: "#D46A74",
  primaryDark: "#A4303E",
  primarySoft: "rgba(212,106,116,0.16)",
  success: "#22C55E",
  danger: "#EF4444",
};

const lightColors: ThemeColors = {
  background: "#F4F4F5",
  sidebar: "#FFFFFF",
  card: "#FFFFFF",
  cardSoft: "#F9FAFB",
  box: "#F3F4F6",
  input: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  subtext: "#6B7280",
  primary: "#B32636",
  primaryDark: "#8F1D2C",
  primarySoft: "rgba(179,38,54,0.12)",
  success: "#16A34A",
  danger: "#DC2626",
};

const ThemeContext = createContext<ThemeContextData>({
  colors: darkColors,
  isDark: true,
  toggleTheme: async () => {},
  fontScale: 100,
  changeFontScale: () => {},
  colorblindPalette: false,
  toggleColorblindPalette: async () => {},
  resetAccessibility: async () => {},
});

const STORAGE_KEY = "@toyota_ace_vendedor:theme";
const FONT_SCALE_KEY = "@toyota_ace_vendedor:accessibility-font-scale";
const COLORBLIND_KEY = "@toyota_ace_vendedor:accessibility-colorblind";
const FONT_SCALES = [100, 112.5, 125, 137.5, 150];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [fontScale, setFontScale] = useState(100);
  const [colorblindPalette, setColorblindPalette] = useState(false);

  const baseColors = isDark ? darkColors : lightColors;
  const colors = colorblindPalette
    ? {
        ...baseColors,
        primary: isDark ? "#56B4E9" : "#0072B2",
        primaryDark: isDark ? "#0072B2" : "#005A8D",
        primarySoft: isDark
          ? "rgba(86,180,233,0.18)"
          : "rgba(0,114,178,0.12)",
        success: isDark ? "#56B4E9" : "#0072B2",
        danger: isDark ? "#FF9A66" : "#C2410C",
      }
    : baseColors;

  useEffect(() => {
    carregarTemaSalvo();
  }, []);

  async function carregarTemaSalvo() {
    try {
      const temaSalvo = await AsyncStorage.getItem(STORAGE_KEY);
      const [savedFontScale, savedColorblindPalette] = await Promise.all([
        AsyncStorage.getItem(FONT_SCALE_KEY),
        AsyncStorage.getItem(COLORBLIND_KEY),
      ]);

      if (temaSalvo !== null) {
        setIsDark(temaSalvo === "dark");
      }

      const parsedFontScale = Number(savedFontScale);
      if (FONT_SCALES.includes(parsedFontScale)) {
        setFontScale(parsedFontScale);
      }
      setColorblindPalette(savedColorblindPalette === "true");
    } catch (error) {
      console.log("Erro ao carregar preferências:", error);
    }
  }

  function changeFontScale(direction: -1 | 1) {
    const currentIndex = FONT_SCALES.indexOf(fontScale);
    const nextIndex = Math.min(
      Math.max(currentIndex + direction, 0),
      FONT_SCALES.length - 1
    );
    const nextScale = FONT_SCALES[nextIndex];
    setFontScale(nextScale);
    AsyncStorage.setItem(FONT_SCALE_KEY, String(nextScale)).catch((error) => {
      console.log("Erro ao salvar tamanho do texto:", error);
    });
  }

  async function toggleColorblindPalette() {
    try {
      const nextValue = !colorblindPalette;
      setColorblindPalette(nextValue);
      await AsyncStorage.setItem(COLORBLIND_KEY, String(nextValue));
    } catch (error) {
      console.log("Erro ao salvar paleta de cores:", error);
    }
  }

  async function resetAccessibility() {
    try {
      setFontScale(100);
      setColorblindPalette(false);
      await Promise.all([
        AsyncStorage.setItem(FONT_SCALE_KEY, "100"),
        AsyncStorage.setItem(COLORBLIND_KEY, "false"),
      ]);
    } catch (error) {
      console.log("Erro ao restaurar acessibilidade:", error);
    }
  }

  async function toggleTheme() {
    try {
      const novoTema = !isDark;

      setIsDark(novoTema);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        novoTema ? "dark" : "light"
      );
    } catch (error) {
      console.log("Erro ao salvar tema:", error);
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark,
        toggleTheme,
        fontScale,
        changeFontScale,
        colorblindPalette,
        toggleColorblindPalette,
        resetAccessibility,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}