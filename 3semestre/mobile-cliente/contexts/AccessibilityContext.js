import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

const STORAGE_KEY = "@toyota_ace:accessibility";
const defaults = { language: "pt-BR", fontScale: 1, colorFilter: "none" };
const filterColors = {
  none: "transparent",
  "high-contrast": "rgba(255,255,255,0.12)",
  protanopia: "rgba(90,190,220,0.12)",
  deuteranopia: "rgba(240,210,90,0.12)",
  tritanopia: "rgba(210,110,150,0.12)",
};

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(defaults);
  const [hydrated, setHydrated] = useState(false);
  const readableTexts = useRef(new Map());

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!active || !saved) return;
        const parsed = JSON.parse(saved);
        const language = ["pt-BR", "en-US", "es-ES", "ja-JP"].includes(parsed.language)
          ? parsed.language
          : defaults.language;
        const fontScale = Math.max(0.85, Math.min(1.3, Number(parsed.fontScale) || 1));
        const colorFilter = Object.prototype.hasOwnProperty.call(filterColors, parsed.colorFilter)
          ? parsed.colorFilter
          : defaults.colorFilter;
        setSettings({ language, fontScale, colorFilter });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [hydrated, settings]);

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function registerText(id, value) {
    if (value) readableTexts.current.set(id, value);
    else readableTexts.current.delete(id);
  }

  function getReadableText() {
    return Array.from(readableTexts.current.values()).join(". ");
  }

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        hydrated,
        updateSetting,
        resetSettings: () => setSettings(defaults),
        registerText,
        getReadableText,
      }}
    >
      <View style={styles.root}>
        {children}
        <View
          pointerEvents="none"
          style={[styles.filter, { backgroundColor: filterColors[settings.colorFilter] }]}
        />
      </View>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("useAccessibility deve ser usado dentro de AccessibilityProvider");
  return context;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filter: { ...StyleSheet.absoluteFillObject, zIndex: 90 },
});