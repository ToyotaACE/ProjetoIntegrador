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
} from "react-native";
import {
  AccessibleText as Text,
  AccessibleTextInput as TextInput,
} from "@/components/AccessibleText";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedAlert } from "@/hooks/useLocalizedAlert";

export default function Cadastro() {
  const Alert = useLocalizedAlert();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const senhaRef = useRef<any>(null);

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

  function handleCadastro() {
    Keyboard.dismiss();

    const emailValido = validarEmail(email);

    if (!nome || !emailValido || !senha) {
      Alert.alert("Erro", "Verifique os dados");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Erro", "Senha mínima de 6 caracteres");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      Alert.alert("Sucesso", "Conta criada!");
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
                    ? "rgba(30,41,59,0.85)"
                    : "rgba(255,255,255,0.9)",
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.text }]}>
                Cadastro
              </Text>

              <TextInput
                placeholder="Nome"
                value={nome}
                returnKeyType="next"
                onSubmitEditing={() => senhaRef.current?.focus()}
                onChangeText={setNome}
                style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              />

              <TextInput
                placeholder="E-mail"
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

              {erroEmail && (
                <Text style={[styles.erroTexto, { color: colors.danger }]}>
                  {erroEmail}
                </Text>
              )}

              <TextInput
                ref={senhaRef}
                placeholder="Senha"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleCadastro}
                value={senha}
                onChangeText={setSenha}
                style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              />

              <TouchableOpacity
                onPress={handleCadastro}
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    opacity:
                      !nome || !email || !!erroEmail || !senha || loading ? 0.6 : 1,
                  },
                ]}
                disabled={!nome || !email || !!erroEmail || !senha || loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Criando..." : "Cadastrar"}
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
    paddingBottom: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
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
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    textAlign: "center",
    marginTop: 15,
  },
});