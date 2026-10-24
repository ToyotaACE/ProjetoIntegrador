import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { PurchasesProvider } from "../contexts/PurchasesContext";
import { AccessibilityProvider, useAccessibility } from "../contexts/AccessibilityContext";
import AccessibilityMenu from "../components/AccessibilityMenu";

function RootNavigator() {
  const { isAuthenticated, loadingAuth } = useAuth();
  const { hydrated } = useAccessibility();
  const { theme } = useTheme();

  if (loadingAuth || !hydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
        </>
      ) : (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="vehicle-documents" />
        </>
      )}
    </Stack>
  );
}

function AccessibilityControls() {
  const { hydrated } = useAccessibility();
  return hydrated ? <AccessibilityMenu /> : null;
}

export default function Layout() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <ThemeProvider>
          <PurchasesProvider>
            <RootNavigator />
            <AccessibilityControls />
          </PurchasesProvider>
        </ThemeProvider>
      </AuthProvider>
    </AccessibilityProvider>
  );
}