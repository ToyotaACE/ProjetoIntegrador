import { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  StyleSheet,
  type TextInput as NativeTextInput,
} from "react-native";
import {
  AccessibleText as Text,
  AccessibleTextInput as TextInput,
} from "@/components/AccessibleText";
import { useRouter } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedAlert } from "@/hooks/useLocalizedAlert";

export default function Login() {
  const Alert = useLocalizedAlert();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const senhaRef = useRef<NativeTextInput>(null);

  function validarEmail(valor: string) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!valor) {
      setErroEmail("Digite um e-mail");
      return false;
    }

    if (!regex.test(valor)) {
      setErroEmail("E-mail inválido");
      return false;
    }

    setErroEmail("");
    return true;
  }

  async function handleLogin() {
    Keyboard.dismiss();

    const emailValido = validarEmail(email);

    if (!emailValido || !senha) {
      Alert.alert("Erro", "Preencha os campos corretamente.");
      return;
    }

    setLoading(true);

    try {
      await login(email, senha);

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Erro ao entrar", error?.message || "Falha ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <ImageBackground
          source={require("@/assets/images/login-bg-web.png")}
          style={styles.background}
          resizeMode="contain"
          blurRadius={isDark ? 6 : 2}
        >
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/toyota_logo.png")}
                style={styles.logo}
              />

              <Text style={styles.logoText}>TOYOTA ACE</Text>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark
                    ? "rgba(30,41,59,0.88)"
                    : "rgba(255,255,255,0.92)",
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.text }]}>Login</Text>

              <Text style={[styles.subtitle, { color: colors.subtext }]}>
                Acesse como administrador ou vendedor
              </Text>

              <TextInput
                placeholder="Digite seu e-mail"
                placeholderTextColor={colors.subtext}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => senhaRef.current?.focus()}
                onChangeText={(text) => {
                  const clean = text.trim();
                  setEmail(clean);
                  validarEmail(clean);
                }}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    color: colors.text,
                    borderColor: erroEmail ? colors.danger : "transparent",
                  },
                ]}
              />

              {erroEmail ? (
                <Text style={[styles.erroTexto, { color: colors.danger }]}>
                  {erroEmail}
                </Text>
              ) : null}

              <TextInput
                ref={senhaRef}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.subtext}
                secureTextEntry
                value={senha}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onChangeText={setSenha}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    color: colors.text,
                    borderColor: "transparent",
                  },
                ]}
              />

              <TouchableOpacity
                onPress={handleLogin}
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    opacity:
                      !email || !!erroEmail || !senha || loading ? 0.6 : 1,
                  },
                ]}
                disabled={!email || !!erroEmail || !senha || loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Entrando..." : "Entrar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    backgroundColor: "#02070d",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  logo: {
    width: 45,
    height: 45,
    marginRight: 10,
  },

  logoText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },

  card: {
    width: "100%",
    maxWidth: 400,
    padding: 25,
    borderRadius: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },

  subtitle: {
    marginBottom: 20,
    textAlign: "center",
  },

  input: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },

  erroTexto: {
    marginBottom: 10,
    fontSize: 12,
  },

  button: {
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 15,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  infoBox: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.25)",
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },

  infoText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 3,
  },
});
