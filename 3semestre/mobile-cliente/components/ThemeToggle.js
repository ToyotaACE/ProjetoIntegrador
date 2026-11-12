import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { useTheme } from "../contexts/ThemeContext";
import { translateText } from "../contexts/translations";

export default function ThemeToggle({ showLabel = false }) {
  const { dark, toggleTheme, theme } = useTheme();
  const { settings } = useAccessibility();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={translateText(dark ? "Ativar tema claro" : "Ativar tema escuro", settings.language)}
      onPress={toggleTheme}
      style={[
        styles.button,
        showLabel && styles.settingsButton,
        { backgroundColor: theme.box },
      ]}
    >
      <Ionicons
        name={dark ? "sunny" : "moon"}
        size={20}
        color={dark ? "#facc15" : theme.text}
      />
      {showLabel ? (
        <Text style={[styles.buttonLabel, { color: theme.text }]}>
          {translateText(dark ? "Ativar tema claro" : "Ativar tema escuro", settings.language)}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    marginLeft: 5,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    width: "auto",
    height: 48,
    marginLeft: 0,
    flexDirection: "row",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexShrink: 0,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});