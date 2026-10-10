import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { LocalizedText as Text, LocalizedTextInput as TextInput } from "../components/LocalizedText";
import { useRouter } from "expo-router";

import logoT from "../assets/logoT.png"; // ❗ evita @ se não tiver alias

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

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
    <ImageBackground
      source={{
        uri: "https://mir-s3-cdn-cf.behance.net/project_modules/fs/c84ab249239255.56085275bc31a.png"
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.card}>
          
          <Image source={logoT} style={styles.logo} />

          <Text style={styles.title}>Recuperar Senha</Text>
          <Text style={styles.subtitle}>
            Informe seu email para receber instruções de recuperação
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

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enviar instruções</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.link}>
              Lembrou a senha?{" "}
              <Text style={styles.linkBold}>Voltar ao login</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 16,
    padding: 20
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 10,
    resizeMode: "contain"
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center"
  },
  subtitle: {
    color: "#ddd",
    textAlign: "center",
    marginBottom: 20
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    marginBottom: 12
  },
  message: {
    color: "#4ade80", // verde sucesso
    textAlign: "center",
    marginBottom: 10
  },
  error: {
    color: "#ff4d4d",
    textAlign: "center",
    marginBottom: 10
  },
  button: {
    backgroundColor: "#e11d48",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  },
  link: {
    color: "#fff",
    textAlign: "center",
    marginTop: 15
  },
  linkBold: {
    fontWeight: "bold",
    textDecorationLine: "underline"
  }
});