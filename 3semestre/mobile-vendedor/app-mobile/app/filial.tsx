import { useTheme } from "@/contexts/ThemeContext";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Filial() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Filial</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Gestão da unidade Toyota ACE.
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.subtext }]}>Nome</Text>
            <Text style={[styles.value, { color: colors.text }]}>Toyota ACE - Filial Central</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.subtext }]}>Endereço</Text>
            <Text style={[styles.value, { color: colors.text }]}>Av. Principal, 123 - Centro</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.subtext }]}>Telefone</Text>
            <Text style={[styles.value, { color: colors.text }]}>(11) 4000-0000</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
  },
  infoRow: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
});
