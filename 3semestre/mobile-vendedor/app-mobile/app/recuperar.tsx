import { useState } from "react";
import {
  View,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  StyleSheet,
} from "react-native";
import {
  AccessibleText as Text,
  AccessibleTextInput as TextInput,
} from "@/components/AccessibleText";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedAlert } from "@/hooks/useLocalizedAlert";

export default function RecuperarSenha() {
  const Alert = useLocalizedAlert();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [loading, setLoading] = useState(false);

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

  function handleRecuperar() {
    Keyboard.dismiss();

    const valido = validarEmail(email);

    if (!valido) {
      Alert.alert("Erro", "Digite um e-mail válido");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      Alert.alert("Sucesso", "Instruções enviadas para o e-mail.");
      setLoading(false);
      router.replace("/login");
    }, 1500);
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
          source={require("@/assets/images/login-bg.jpg")}
          style={styles.background}
          blurRadius={isDark ? 6 : 2}
        >
          <View style={styles.container}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark
                    ? "rgba(30,41,59,0.85)"
                    : "rgba(255,255,255,0.9)",
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.text }]}>
                Recuperar Senha
              </Text>

              <Text style={{ color: colors.subtext, marginBottom: 20 ,textAlign: "center",}}>
                Informe seu e-mail
              </Text>

              <TextInput
                placeholder="Digite seu e-mail"
                placeholderTextColor={colors.subtext}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleRecuperar}
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

              <TouchableOpacity
                onPress={handleRecuperar}
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    opacity: !email || !!erroEmail || loading ? 0.6 : 1,
                  },
                ]}
                disabled={!email || !!erroEmail || loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Enviando..." : "Enviar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={[styles.link, { color: colors.text }]}>
                  Voltar para login
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
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    marginBottom: 10,
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
  },
  link: {
    textAlign: "center",
    marginTop: 10,
  },
});