import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import AccessibilityMenu from "../../components/AccessibilityMenu";
import Chatbot from "../../components/Chatbot";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { useTheme } from "../../contexts/ThemeContext";
import { translateText } from "../../contexts/translations";

function HeaderActions() {
  const { logout } = useAuth();
  const { settings } = useAccessibility();
  const { theme, dark } = useTheme();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={styles.headerActions}>
      <ThemeToggle />
      <AccessibilityMenu />
      <Chatbot />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={translateText("Sair", settings.language)}
        onPress={handleLogout}
        style={[styles.actionButton, { backgroundColor: theme.box }]}
      >
        <Ionicons name="log-out-outline" size={20} color={dark ? "#f87171" : "#c62828"} />
      </TouchableOpacity>
    </View>
  );
}

export default function TabsLayout() {
  const { theme, dark } = useTheme();
  const { settings } = useAccessibility();
  const tabLabels = {
    "pt-BR": ["Início", "Veículo", "Financeiro", "Agenda", "Loja", "Perfil"],
    "en-US": ["Home", "Vehicle", "Financing", "Schedule", "Shop", "Profile"],
    "es-ES": ["Inicio", "Vehículo", "Financiación", "Agenda", "Tienda", "Perfil"],
    "ja-JP": ["ホーム", "車両", "ローン", "予約", "ショップ", "プロフィール"],
  }[settings.language];

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.card,
          },
          headerShadowVisible: false,
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: "700",
          },
          headerRight: () => <HeaderActions />,
          headerRightContainerStyle: {
            paddingRight: 8,
          },
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.box,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: Platform.OS === "android" ? 64 : undefined,
            paddingTop: 6,
            paddingBottom: Platform.OS === "android" ? 6 : undefined,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: dark ? "#929292" : "#777",
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
          },
        }}
      >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: tabLabels[0],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="vehicle"
        options={{
          title: tabLabels[1],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="financing"
        options={{
          title: tabLabels[2],
          href: null,
        }}
      />

      <Tabs.Screen
        name="scheduling"
        options={{
          title: tabLabels[3],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: tabLabels[4],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: tabLabels[5],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    marginLeft: 5,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});