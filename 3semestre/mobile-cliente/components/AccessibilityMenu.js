import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAccessibility } from "../contexts/AccessibilityContext";
import { translateText } from "../contexts/translations";

const languages = [
  { id: "pt-BR", label: "Português (Brasil)" },
  { id: "en-US", label: "English" },
  { id: "es-ES", label: "Español" },
  { id: "ja-JP", label: "日本語" },
];

const colorFilters = [
  { id: "none", label: "Sem filtro", ja: "フィルターなし", color: "#71717a" },
  { id: "high-contrast", label: "Alto contraste", ja: "高コントラスト", color: "#fff" },
  { id: "protanopia", label: "Protanopia", ja: "1型色覚", color: "#5abedc" },
  { id: "deuteranopia", label: "Deuteranopia", ja: "2型色覚", color: "#f0d25a" },
  { id: "tritanopia", label: "Tritanopia", ja: "3型色覚", color: "#d26e96" },
];

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const { settings, updateSetting, resetSettings, getReadableText } = useAccessibility();
  const japanese = settings.language === "ja-JP";
  const label = (pt, ja) => japanese ? ja : translateText(pt, settings.language);

  async function toggleReading() {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }

    const content = getReadableText().replace(/\s+/g, " ").trim();
    if (!content) return;

    setSpeaking(true);
    Speech.speak(content, {
      language: settings.language,
      rate: 0.92,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  function reset() {
    Speech.stop();
    setSpeaking(false);
    resetSettings();
  }

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label("Abrir acessibilidade", "アクセシビリティを開く")}
        onPress={() => setOpen(true)}
        style={styles.floatingButton}
      >
        <Ionicons name="accessibility" size={25} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            accessibilityLabel={label("Fechar acessibilidade", "アクセシビリティを閉じる")}
            activeOpacity={1}
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />
          <View style={styles.panel}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Ionicons name="accessibility" size={22} color="#d71920" />
                <Text style={styles.title}>
                  {label("Acessibilidade", "アクセシビリティ")}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={label("Fechar", "閉じる")}
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={23} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <TouchableOpacity onPress={toggleReading} style={styles.readButton}>
                <Ionicons name={speaking ? "volume-mute" : "volume-high"} size={19} color="#fff" />
                <Text style={styles.readButtonText}>
                  {speaking ? label("Parar leitura", "読み上げを停止") : label("Ler página", "ページを読み上げる")}
                </Text>
              </TouchableOpacity>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{label("Tamanho do texto", "文字サイズ")}</Text>
                  <Text style={styles.value}>{Math.round(settings.fontScale * 100)}%</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    accessibilityLabel={label("Diminuir tamanho do texto", "文字を小さくする")}
                    disabled={settings.fontScale <= 0.85}
                    onPress={() => updateSetting("fontScale", Math.max(0.85, Number((settings.fontScale - 0.05).toFixed(2))))}
                    style={styles.stepButton}
                  >
                    <Ionicons name="remove" size={21} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.scaleTrack}>
                    <View style={[styles.scaleFill, { width: `${((settings.fontScale - 0.85) / 0.45) * 100}%` }]} />
                  </View>
                  <TouchableOpacity
                    accessibilityLabel={label("Aumentar tamanho do texto", "文字を大きくする")}
                    disabled={settings.fontScale >= 1.3}
                    onPress={() => updateSetting("fontScale", Math.min(1.3, Number((settings.fontScale + 0.05).toFixed(2))))}
                    style={styles.stepButton}
                  >
                    <Ionicons name="add" size={21} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{label("Filtro de cores", "色覚フィルター")}</Text>
                <View style={styles.filters}>
                  {colorFilters.map((filter) => {
                    const selected = settings.colorFilter === filter.id;
                    return (
                      <TouchableOpacity
                        key={filter.id}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => updateSetting("colorFilter", filter.id)}
                        style={[styles.filterOption, selected && styles.filterSelected]}
                      >
                        <View style={[styles.swatch, { backgroundColor: filter.color }]} />
                        <Text style={styles.filterLabel}>
                          {japanese ? filter.ja : translateText(filter.label, settings.language)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{label("Idioma", "言語")}</Text>
                <View style={styles.languageRow}>
                  {languages.map((language) => {
                    const selected = settings.language === language.id;
                    return (
                      <TouchableOpacity
                        key={language.id}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => updateSetting("language", language.id)}
                        style={[styles.languageOption, selected && styles.languageSelected]}
                      >
                        <Text style={[styles.languageText, selected && styles.selectedText]}>
                          {language.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity onPress={reset} style={styles.resetButton}>
                <Ionicons name="refresh" size={17} color="#bdbdbd" />
                <Text style={styles.resetText}>{label("Restaurar preferências", "設定をリセット")}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    left: 18,
    bottom: 84,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d71920",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  modalRoot: { flex: 1, justifyContent: "flex-end", padding: 14 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  panel: { maxHeight: "86%", borderRadius: 20, overflow: "hidden", backgroundColor: "#171717", borderColor: "#3b3b3b", borderWidth: 1 },
  header: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 17, borderBottomWidth: 1, borderBottomColor: "#363636" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  closeButton: { padding: 5 },
  content: { padding: 16, gap: 17 },
  readButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 9, backgroundColor: "#b91c24" },
  readButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  section: { gap: 9 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: "#f5f5f5", fontWeight: "600", fontSize: 14 },
  value: { color: "#bbb", fontSize: 13, fontVariant: ["tabular-nums"] },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepButton: { width: 38, height: 38, borderWidth: 1, borderColor: "#555", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  scaleTrack: { flex: 1, height: 5, overflow: "hidden", borderRadius: 4, backgroundColor: "#484848" },
  scaleFill: { height: 5, borderRadius: 4, backgroundColor: "#ef4444" },
  filters: { gap: 7 },
  filterOption: { minHeight: 38, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#3b3b3b", borderRadius: 8, backgroundColor: "#202020" },
  filterSelected: { borderColor: "#ef4444", backgroundColor: "#342020" },
  swatch: { width: 18, height: 18, borderWidth: 1, borderColor: "#666", borderRadius: 9 },
  filterLabel: { color: "#e5e5e5", fontSize: 13 },
  languageRow: { flexDirection: "row", gap: 9 },
  languageOption: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#444", borderRadius: 8 },
  languageSelected: { borderColor: "#ef4444", backgroundColor: "#342020" },
  languageText: { color: "#ddd", fontSize: 13 },
  selectedText: { color: "#fff", fontWeight: "700" },
  resetButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  resetText: { color: "#bdbdbd", fontSize: 13 },
});