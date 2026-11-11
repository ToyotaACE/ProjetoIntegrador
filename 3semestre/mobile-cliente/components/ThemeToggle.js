import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { useTheme } from "../contexts/ThemeContext";
import { translateText } from "../contexts/translations";

export default function ThemeToggle() {
  const { dark, toggleTheme, theme } = useTheme();
  const { settings } = useAccessibility();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={translateText(dark ? "Ativar tema claro" : "Ativar tema escuro", settings.language)}
      onPress={toggleTheme}
      style={[styles.button, { backgroundColor: theme.box }]}
    >
      <Ionicons
        name={dark ? "sunny" : "moon"}
        size={20}
        color={dark ? "#facc15" : theme.text}
      />
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
});