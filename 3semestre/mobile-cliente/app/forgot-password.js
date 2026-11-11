import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { LocalizedText as Text, LocalizedTextInput as TextInput } from "../components/LocalizedText";
import { useRouter } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";

import logoT from "../assets/logoT.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { theme, dark } = useTheme();

  const handleSubmit = () => {
    if (loading) return;

    setError("");
    setMessage("");

    if (!email) {
      setError("Digite seu email.");
      return;
    }

    setLoading(true);

    // simulação de envio
    setTimeout(() => {
      setLoading(false);
      setMessage(
        "Se o email existir, enviaremos instruções para recuperação."
      );
      setEmail("");
    }, 800);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.background, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.box },
          ]}
        >
          <Image source={logoT} style={styles.logo} />
          <Text style={[styles.title, { color: theme.text }]}>Recuperar Senha</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Informe seu email para receber instruções de recuperação
          </Text>
          <TextInput
            placeholder="seu@email.com"
            placeholderTextColor={theme.muted}
            value={email}
            onChangeText={setEmail}
            style={[
              styles.input,
              {
                backgroundColor: dark ? "#141414" : "#f5f5f5",
                borderColor: theme.box,
                color: theme.text,
              },
            ]}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enviar instruções</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={[styles.link, { color: theme.subtext }]}>
              Lembrou a senha?{" "}
              <Text style={[styles.linkBold, { color: theme.primary }]}>Voltar ao login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20
  },
  logo: {
    width: 54,
    height: 54,
    alignSelf: "center",
    marginBottom: 14,
    resizeMode: "contain"
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center"
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 11,
    fontSize: 14
  },
  message: {
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 10
  },
  error: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 10
  },
  button: {
    minHeight: 50,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800"
  },
  link: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 12
  },
  linkBold: {
    fontWeight: "800"
  }
});