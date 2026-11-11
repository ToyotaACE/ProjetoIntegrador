import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LocalizedText as Text, LocalizedTextInput as TextInput } from "../components/LocalizedText";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

import logoT from "../assets/logoT.png";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, dark } = useTheme();
  const router = useRouter();

  const handleRegister = async () => {
    if (loading) return;

    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/clientes/cadastro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: name.trim(),
          email: email.trim(),
          senha: password,
        }),
      });

      if (!response.ok) {
        const erro = await response.text();
        console.log("Erro cadastro:", erro);

        if (response.status === 409) {
          throw new Error("E-mail já cadastrado.");
        }

        throw new Error("Erro ao cadastrar usuário.");
      }

      await login(email.trim(), password);

      router.replace("/(tabs)/dashboard");
    } catch (err) {
        setError(err.message || "Erro ao criar conta.");
      } setLoading(false);
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
          <Text style={[styles.title, { color: theme.text }]}>Criar Conta</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Cadastre-se para acompanhar seu veículo
          </Text>

          <TextInput
            placeholder="Seu nome"
            placeholderTextColor={theme.muted}
            value={name}
            onChangeText={setName}
            style={[
              styles.input,
              {
                backgroundColor: dark ? "#141414" : "#f5f5f5",
                borderColor: theme.box,
                color: theme.text,
              },
            ]}
          />
          <TextInput
            placeholder="seu@email.com"
            placeholderTextColor={theme.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[
              styles.input,
              {
                backgroundColor: dark ? "#141414" : "#f5f5f5",
                borderColor: theme.box,
                color: theme.text,
              },
            ]}
          />
          <TextInput
            placeholder="Senha"
            placeholderTextColor={theme.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[
              styles.input,
              {
                backgroundColor: dark ? "#141414" : "#f5f5f5",
                borderColor: theme.box,
                color: theme.text,
              },
            ]}
          />
          <TextInput
            placeholder="Confirmar senha"
            placeholderTextColor={theme.muted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={[
              styles.input,
              {
                backgroundColor: dark ? "#141414" : "#f5f5f5",
                borderColor: theme.box,
                color: theme.text,
              },
            ]}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Criar conta</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={[styles.link, { color: theme.subtext }]}>
              Já tem conta?{" "}
              <Text style={[styles.linkBold, { color: theme.primary }]}>Entrar</Text>
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
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  logo: {
    width: 54,
    height: 54,
    alignSelf: "center",
    marginBottom: 14,
    resizeMode: "contain",
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 11,
    fontSize: 14,
  },
  button: {
    minHeight: 50,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  buttonText: { color: "#fff", fontWeight: "800" },
  link: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 12,
  },
  linkBold: { fontWeight: "800" },
  error: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 10,
  },
});