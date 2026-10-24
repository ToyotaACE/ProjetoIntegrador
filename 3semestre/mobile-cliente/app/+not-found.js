import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";

import { LocalizedText as Text } from "../components/LocalizedText";
import { useTheme } from "../contexts/ThemeContext";

export default function NotFoundScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Oops! Page not found</Text>
      <Link href="/" accessibilityRole="link" style={styles.link}>
        <Text style={styles.linkText}>Return to Home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  link: { padding: 12 },
  linkText: { color: "#d71920", fontSize: 16, fontWeight: "600" },
});
