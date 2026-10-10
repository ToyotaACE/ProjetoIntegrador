import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LocalizedText as Text, LocalizedTextInput as TextInput } from "../components/LocalizedText";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

import logoT from "../assets/logoT.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);

      await login(email.trim(), password);

      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{
        uri: "https://mir-s3-cdn-cf.behance.net/project_modules/fs/c84ab249239255.56085275bc31a.png",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Image source={logoT} style={styles.logo} />

          <Text style={styles.title}>TOYOTA ACE</Text>
          <Text style={styles.subtitle}>
            Acesse sua conta para acompanhar seu veículo
          </Text>

          <TextInput
            placeholder="seu@email.com"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="••••••••"
            placeholderTextColor="#ccc"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/forgot-password")}>
            <Text style={styles.link}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.register}>
              Não tem conta?{" "}
              <Text style={styles.registerBold}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    padding: 20,
  },

  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 10,
    resizeMode: "contain",
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    color: "#ddd",
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#e11d48",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  link: {
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
    fontSize: 12,
  },

  register: {
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
  },

  registerBold: {
    fontWeight: "bold",
    color: "#f43f5e",
  },

  error: {
    color: "#ff4d4d",
    marginBottom: 10,
    textAlign: "center",
  },
});