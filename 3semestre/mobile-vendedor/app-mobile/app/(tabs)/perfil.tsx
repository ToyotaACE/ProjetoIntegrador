import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { AccessibleText as Text } from "@/components/AccessibleText";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProfilePage() {
  const {
    colors,
    isDark,
    toggleTheme,
    fontScale,
    changeFontScale,
    colorblindPalette,
    toggleColorblindPalette,
    resetAccessibility,
  } = useTheme();
  const { t } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.log("Erro ao sair:", error);
      router.replace("/login");
    }
  }

  const nome = user?.nome || "Usuário Toyota";
  const email = user?.email || "email não informado";
  const perfil = user?.perfil || "VENDEDOR";

  function initials(nomeUsuario: string) {
    return nomeUsuario
      .split(" ")
      .map((parte) => parte[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("Perfil do Vendedor")}
          </Text>

          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {t("Visualize suas informações de acesso ao Toyota ACE.")}
          </Text>
        </View>

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isAdmin
                  ? colors.primarySoft
                  : "rgba(37,99,235,0.16)",
                borderColor: isAdmin ? colors.primary : "#2563EB",
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isAdmin ? colors.primary : "#60A5FA" },
              ]}
            >
              {initials(nome)}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {nome}
            </Text>

            <Text style={[styles.profileEmail, { color: colors.subtext }]}>
              {email}
            </Text>

            <View
              style={[
                styles.profileBadge,
                {
                  backgroundColor: isAdmin
                    ? colors.primarySoft
                    : "rgba(37,99,235,0.15)",
                },
              ]}
            >
              <Ionicons
                name={isAdmin ? "shield-checkmark-outline" : "person-outline"}
                size={14}
                color={isAdmin ? colors.primary : "#60A5FA"}
              />

              <Text
                style={[
                  styles.profileBadgeText,
                  { color: isAdmin ? colors.primary : "#60A5FA" },
                ]}
              >
                {perfil}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t("Dados da Conta")}
          </Text>

          <InfoRow
            icon="person-outline"
            label={t("Nome")}
            value={nome}
            colors={colors}
          />

          <InfoRow
            icon="mail-outline"
            label={t("E-mail")}
            value={email}
            colors={colors}
          />

          <InfoRow
            icon="briefcase-outline"
            label={t("Perfil")}
            value={isAdmin ? t("Administrador") : t("Vendedor")}
            colors={colors}
          />

          <InfoRow
            icon="checkmark-circle-outline"
            label={t("Status")}
            value={t("Ativo")}
            colors={colors}
          />
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t("Permissões")}
          </Text>

          <PermissionRow
            enabled
            text={t("Acessar dashboard")}
            colors={colors}
          />

          <PermissionRow
            enabled
            text={t("Gerenciar clientes")}
            colors={colors}
          />

          <PermissionRow
            enabled
            text={t("Acompanhar veículos e agenda")}
            colors={colors}
          />

          <PermissionRow
            enabled={isAdmin}
            text={t("Gerenciar usuários vendedores")}
            colors={colors}
          />
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t("Acessibilidade")}
          </Text>
          <Text style={[styles.accessibilityDescription, { color: colors.subtext }]}>
            {t("Ajuste a leitura e as cores da interface.")}
          </Text>

          <View style={styles.accessibilityRow}>
            <View style={styles.accessibilityText}>
              <Text style={[styles.accessibilityLabel, { color: colors.text }]}>
                {t("Tamanho do texto")}
              </Text>
              <Text style={[styles.themeSubtitle, { color: colors.subtext }]}>
                {fontScale}%
              </Text>
            </View>
            <View style={styles.scaleButtons}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("Diminuir texto")}
                accessibilityState={{ disabled: fontScale === 100 }}
                disabled={fontScale === 100}
                style={[
                  styles.scaleButton,
                  { backgroundColor: colors.box },
                  fontScale === 100 && styles.disabledButton,
                ]}
                onPress={() => changeFontScale(-1)}
              >
                <Ionicons name="remove-outline" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("Aumentar texto")}
                accessibilityState={{ disabled: fontScale === 150 }}
                disabled={fontScale === 150}
                style={[
                  styles.scaleButton,
                  { backgroundColor: colors.box },
                  fontScale === 150 && styles.disabledButton,
                ]}
                onPress={() => changeFontScale(1)}
              >
                <Ionicons name="add-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.accessibilityRow}>
            <View style={styles.accessibilityText}>
              <Text style={[styles.accessibilityLabel, { color: colors.text }]}>
                {t("Paleta para daltonismo")}
              </Text>
              <Text style={[styles.themeSubtitle, { color: colors.subtext }]}>
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

          <TouchableOpacity
            accessibilityRole="button"
            disabled={fontScale === 100 && !colorblindPalette}
            style={[
              styles.resetAccessibilityButton,
              { borderColor: colors.border },
              fontScale === 100 &&
                !colorblindPalette &&
                styles.disabledButton,
            ]}
            onPress={resetAccessibility}
          >
            <Ionicons name="refresh-outline" size={17} color={colors.primary} />
            <Text style={[styles.resetAccessibilityText, { color: colors.text }]}>
              {t("Restaurar padrão")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.themeButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleTheme}
        >
          <View style={styles.themeLeft}>
            <Ionicons
              name={isDark ? "moon-outline" : "sunny-outline"}
              size={22}
              color={colors.primary}
            />

            <View>
              <Text style={[styles.themeTitle, { color: colors.text }]}>
                {t("Aparência")}
              </Text>

              <Text style={[styles.themeSubtitle, { color: colors.subtext }]}>
                {t("Tema atual: {theme}", {
                  theme: t(isDark ? "Escuro" : "Claro"),
                })}
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color={colors.subtext}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.danger }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>{t("Sair da Conta")}</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.subtext }]}>
          Toyota ACE Vendedor
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: any;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.infoIcon,
          { backgroundColor: colors.primarySoft },
        ]}
      >
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>

        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function PermissionRow({
  enabled,
  text,
  colors,
}: {
  enabled: boolean;
  text: string;
  colors: any;
}) {
  return (
    <View style={styles.permissionRow}>
      <Ionicons
        name={enabled ? "checkmark-circle-outline" : "close-circle-outline"}
        size={20}
        color={enabled ? colors.success : colors.subtext}
      />

      <Text
        style={[
          styles.permissionText,
          { color: enabled ? colors.text : colors.subtext },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  accessibilityDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: -7,
    marginBottom: 8,
  },

  accessibilityRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
  },

  accessibilityText: {
    flex: 1,
  },

  accessibilityLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  scaleButtons: {
    flexDirection: "row",
    gap: 8,
  },

  scaleButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.4,
  },

  resetAccessibilityButton: {
    minHeight: 42,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  resetAccessibilityText: {
    fontSize: 14,
    fontWeight: "500",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
  },

  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },

  profileCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },

  profileEmail: {
    marginTop: 3,
    fontSize: 13,
  },

  profileBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  profileBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  card: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 12,
  },

  value: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "600",
  },

  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  permissionText: {
    fontSize: 14,
    fontWeight: "500",
  },

  themeButton: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  themeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  themeTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },

  themeSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  footer: {
    textAlign: "center",
    marginTop: 22,
    fontSize: 12,
  },
});