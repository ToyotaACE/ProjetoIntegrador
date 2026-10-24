import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import Chatbot from "../../components/Chatbot";
import ThemeToggle from "../../components/ThemeToggle";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function TabsLayout() {
  const { theme } = useTheme();
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
          headerTintColor: theme.text,
          headerRight: () => <ThemeToggle />,
          tabBarStyle: {
            backgroundColor: "#111",
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: "#ef4444",
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
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
      <Chatbot />
    </View>
  );
}