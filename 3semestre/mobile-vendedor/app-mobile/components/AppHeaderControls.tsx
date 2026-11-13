import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useState } from "react";
import { AccessibleText as Text } from "@/components/AccessibleText";
import { LANGUAGE_OPTIONS, useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

export function AppHeaderControls() {
  const { colors, isDark, toggleTheme, fontScale, changeFontScale,
    colorblindPalette, toggleColorblindPalette, resetAccessibility } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [accessibilityModalVisible, setAccessibilityModalVisible] = useState(false);

  const modalStyle = [
    styles.modalCard,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
        style={[styles.hamburgerButton, { backgroundColor: colors.box, borderColor: colors.border }]}
        onPress={() => setMenuVisible(true)}
      >
        <Ionicons name="menu" size={27} color={colors.text} />
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable
            style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(event) => event.stopPropagation()}
          >
            <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); setLanguageModalVisible(true); }}>
              <Ionicons name="language-outline" size={21} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Idioma: {language.toUpperCase()}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); setAccessibilityModalVisible(true); }}>
              <Ionicons name="accessibility-outline" size={21} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Acessibilidade</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { toggleTheme(); setMenuVisible(false); }}>
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={21} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t(isDark ? "Escuro" : "Claro")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.controls, styles.hiddenControls]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Selecionar idioma da aplicação")}
          style={[
            styles.languageButton,
            { backgroundColor: colors.box, borderColor: colors.border },
          ]}
          onPress={() => setLanguageModalVisible(true)}
        >
          <Ionicons name="language-outline" size={17} color={colors.text} />
          <Text style={[styles.languageCode, { color: colors.text }]}>
            {language.toUpperCase()}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Abrir opções de acessibilidade")}
          style={[
            styles.controlButton,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setAccessibilityModalVisible(true)}
        >
          <Ionicons name="accessibility-outline" size={21} color={colors.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Alternar tema da aplicação")}
          style={[
            styles.themeButton,
            { backgroundColor: colors.box, borderColor: colors.border },
          ]}
          onPress={toggleTheme}
        >
          <Ionicons
            name={isDark ? "moon-outline" : "sunny-outline"}
            size={18}
            color={colors.primary}
          />
          <Text style={[styles.themeLabel, { color: colors.text }]}>
            {t(isDark ? "Escuro" : "Claro")}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable style={modalStyle} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeading}>
              <Ionicons name="language-outline" size={22} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("Escolha o idioma")}
              </Text>
            </View>
            {LANGUAGE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: language === option.value }}
                style={[
                  styles.languageOption,
                  {
                    backgroundColor:
                      language === option.value ? colors.primarySoft : colors.box,
                    borderColor:
                      language === option.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={async () => {
                  await setLanguage(option.value);
                  setLanguageModalVisible(false);
                }}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {option.nativeName}
                </Text>
                {language === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={accessibilityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAccessibilityModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAccessibilityModalVisible(false)}
        >
          <Pressable style={modalStyle} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeading}>
              <Ionicons
                name="accessibility-outline"
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("Opções de acessibilidade")}
              </Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t("Tamanho do texto")}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.subtext }]}>
                  {fontScale}%
                </Text>
              </View>
              <View style={styles.scaleControls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("Diminuir texto")}
                  accessibilityState={{ disabled: fontScale === 100 }}
                  disabled={fontScale === 100}
                  style={[
                    styles.scaleButton,
                    { backgroundColor: colors.box, borderColor: colors.border },
                    fontScale === 100 && styles.disabled,
                  ]}
                  onPress={() => changeFontScale(-1)}
                >
                  <Ionicons name="remove" size={20} color={colors.text} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("Aumentar texto")}
                  accessibilityState={{ disabled: fontScale === 150 }}
                  disabled={fontScale === 150}
                  style={[
                    styles.scaleButton,
                    { backgroundColor: colors.box, borderColor: colors.border },
                    fontScale === 150 && styles.disabled,
                  ]}
                  onPress={() => changeFontScale(1)}
                >
                  <Ionicons name="add" size={20} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t("Paleta para daltonismo")}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.subtext }]}>
                  {t("Usa azul e laranja no lugar de vermelho e verde.")}
                </Text>
              </View>
              <Switch
                accessibilityLabel={t("Paleta para daltonismo")}
                accessibilityRole="switch"
                accessibilityState={{ checked: colorblindPalette }}
                value={colorblindPalette}
                onValueChange={toggleColorblindPalette}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={fontScale === 100 && !colorblindPalette}
              style={[
                styles.resetButton,
                { borderColor: colors.border },
                fontScale === 100 && !colorblindPalette && styles.disabled,
              ]}
              onPress={resetAccessibility}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={[styles.resetText, { color: colors.text }]}>
                {t("Restaurar padrão")}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    width: 42,
    height: 42,
    marginRight: 8,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  menuBackdrop: {
    flex: 1,
    alignItems: "flex-end",
    paddingTop: 58,
    paddingRight: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  menuCard: {
    width: 245,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    gap: 4,
  },
  menuItem: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuItemText: { fontSize: 14, fontWeight: "600" },
  hiddenControls: { display: "none" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginRight: 8,
  },
  languageButton: {
    height: 40,
    minWidth: 48,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  languageCode: { fontSize: 11, fontWeight: "800" },
  controlButton: {
    width: 42,
    height: 42,
    borderWidth: 1.5,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  themeButton: {
    height: 42,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  themeLabel: { fontSize: 11, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: "700" },
  languageOption: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: { fontSize: 15, fontWeight: "600" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 5,
  },
  settingCopy: { flex: 1, gap: 3 },
  settingTitle: { fontSize: 14, fontWeight: "600" },
  settingDescription: { fontSize: 12, lineHeight: 17 },
  scaleControls: { flexDirection: "row", gap: 8 },
  scaleButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    minHeight: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    paddingTop: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resetText: { fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.4 },
});
