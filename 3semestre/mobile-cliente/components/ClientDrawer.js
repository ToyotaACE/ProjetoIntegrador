import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocalizedText as Text } from "./LocalizedText";
import AccessibilityMenu from "./AccessibilityMenu";
import Chatbot from "./Chatbot";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const menuCopy = {
  "pt-BR": {
    navigation: "NAVEGAÇÃO",
    services: "CONTA E SERVIÇOS",
    home: "Início",
    vehicle: "Veículos",
    financing: "Financiamento",
    scheduling: "Agendamentos",
    shop: "Toyota Shop",
    accessibility: "Acessibilidade",
    chatbot: "Assistente Toyota",
    settings: "Configurações",
    close: "Fechar menu",
  },
  "en-US": {
    navigation: "NAVIGATION",
    services: "ACCOUNT AND SERVICES",
    home: "Home",
    vehicle: "Vehicles",
    financing: "Financing",
    scheduling: "Appointments",
    shop: "Toyota Shop",
    accessibility: "Accessibility",
    chatbot: "Toyota Assistant",
    settings: "Settings",
    close: "Close menu",
  },
  "es-ES": {
    navigation: "NAVEGACIÓN",
    services: "CUENTA Y SERVICIOS",
    home: "Inicio",
    vehicle: "Vehículos",
    financing: "Financiación",
    scheduling: "Citas",
    shop: "Toyota Shop",
    accessibility: "Accesibilidad",
    chatbot: "Asistente Toyota",
    settings: "Configuración",
    close: "Cerrar menú",
  },
  "ja-JP": {
    navigation: "ナビゲーション",
    services: "アカウントとサービス",
    home: "ホーム",
    vehicle: "車両",
    financing: "ローン",
    scheduling: "予約",
    shop: "Toyotaショップ",
    accessibility: "アクセシビリティ",
    chatbot: "Toyotaアシスタント",
    settings: "設定",
    close: "メニューを閉じる",
  },
};

const navigationItems = [
  { key: "home", icon: "home-outline", route: "/(tabs)/dashboard" },
  { key: "vehicle", icon: "car-sport-outline", route: "/(tabs)/vehicle" },
  { key: "financing", icon: "card-outline", route: "/(tabs)/financing" },
  { key: "scheduling", icon: "calendar-outline", route: "/(tabs)/scheduling" },
  { key: "shop", icon: "bag-handle-outline", route: "/(tabs)/shop" },
];

export default function ClientDrawer({ visible, onClose }) {
  const { width } = useWindowDimensions();
  const { settings } = useAccessibility();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const drawerWidth = Math.min(width * 0.86, 340);
  const slide = useRef(new Animated.Value(-drawerWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const text = menuCopy[settings.language] || menuCopy["pt-BR"];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: visible ? 0 : -drawerWidth,
        duration: visible ? 240 : 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 240 : 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, drawerWidth, slide, visible]);

  function navigate(route) {
    onClose();
    router.replace(route);
  }

  async function handleLogout() {
    onClose();
    await logout();
    router.replace("/login");
  }

  return (
    <View
      pointerEvents={visible ? "auto" : "none"}
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
    >
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text.close}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            backgroundColor: theme.card,
            borderRightColor: theme.box,
            transform: [{ translateX: slide }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={[styles.header, { borderBottomColor: theme.box }]}>
            <View style={[styles.brandMark, { backgroundColor: theme.primary }]}>
              <Ionicons name="car-sport" size={23} color="#fff" />
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.brand, { color: theme.text }]}>TOYOTA ACE</Text>
              <Text style={[styles.welcome, { color: theme.subtext }]} numberOfLines={1}>
                {user?.nome || user?.name || "Cliente Toyota"}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={text.close}
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.box }]}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionLabel, { color: theme.muted }]}>
              {text.navigation}
            </Text>
            {navigationItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                accessibilityRole="button"
                onPress={() => navigate(item.route)}
                style={styles.navigationItem}
              >
                <Ionicons name={item.icon} size={21} color={theme.subtext} />
                <Text style={[styles.navigationLabel, { color: theme.text }]}>
                  {text[item.key]}
                </Text>
                <Ionicons name="chevron-forward" size={17} color={theme.muted} />
              </TouchableOpacity>
            ))}

            <View style={[styles.separator, { backgroundColor: theme.box }]} />
            <Text style={[styles.sectionLabel, { color: theme.muted }]}>
              {text.services}
            </Text>

            <View style={[styles.actionItem, { backgroundColor: theme.background }]}>
              <AccessibilityMenu inDrawer />
            </View>
            <View style={[styles.actionItem, { backgroundColor: theme.background }]}>
              <Chatbot inDrawer />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigate("/(tabs)/profile")}
              style={[styles.settingsItem, { backgroundColor: theme.background }]}
            >
              <View style={[styles.settingsIcon, { backgroundColor: `${theme.primary}1A` }]}>
                <Ionicons name="settings-outline" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>
                {text.settings}
              </Text>
              <Ionicons name="chevron-forward" size={17} color={theme.muted} />
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleLogout}
            style={[styles.logout, { borderTopColor: theme.box }]}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.primary} />
            <Text style={[styles.logoutLabel, { color: theme.text }]}>
              {settings.language === "en-US"
                ? "Sign out"
                : settings.language === "es-ES"
                  ? "Cerrar sesión"
                  : settings.language === "ja-JP"
                    ? "ログアウト"
                    : "Sair"}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  drawer: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    borderRightWidth: StyleSheet.hairlineWidth,
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  brand: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  welcome: {
    marginTop: 3,
    fontSize: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 22,
  },
  sectionLabel: {
    marginHorizontal: 8,
    marginBottom: 9,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  navigationItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    borderRadius: 12,
  },
  navigationLabel: {
    flex: 1,
    marginLeft: 13,
    fontSize: 14,
    fontWeight: "500",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  actionItem: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
    borderRadius: 13,
  },
  actionLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  settingsItem: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 13,
  },
  settingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logout: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
