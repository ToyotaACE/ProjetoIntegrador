import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LocalizedText as Text, LocalizedTextInput as TextInput } from "./LocalizedText";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { translateText } from "../contexts/translations";

const CHAT_URL = process.env.EXPO_PUBLIC_CHATBOT_URL || "http://localhost:5000/chat";
const suggestions = ["garantia", "financiamento", "retirada"];

export default function Chatbot() {
  const { settings } = useAccessibility();
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "bot",
      text: "Olá! Bem-vindo ao Toyota ACE. Como posso ajudar você hoje?",
    },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  async function sendMessage(value = input) {
    const text = value.trim();

    if (!text || loading) return;

    setInput("");
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, type: "user", text },
    ]);
    setLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: text, idioma: settings.language }),
      });

      if (!response.ok) throw new Error("Resposta inválida do chatbot.");

      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-bot`,
          type: "bot",
          text: data.resposta || "Não consegui entender sua pergunta.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          type: "bot",
          text: "Não foi possível conectar ao assistente. Verifique sua conexão e tente novamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TouchableOpacity
        accessibilityLabel={translateText(visible ? "Fechar assistente Toyota ACE" : "Abrir assistente Toyota ACE", settings.language)}
        onPress={() => setVisible(true)}
        style={styles.floatingButton}
      >
        <Ionicons name="chatbubble-ellipses" size={25} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalRoot}
        >
          <TouchableOpacity
            accessibilityLabel={translateText("Fechar assistente", settings.language)}
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setVisible(false)}
          />
          <View style={styles.panel}>
            <View style={styles.header}>
              <View style={styles.brandIcon}>
                <Ionicons name="car-sport" size={22} color="#d71920" />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Toyota ACE</Text>
                <Text style={styles.subtitle}>Assistente virtual online</Text>
              </View>
              <View style={styles.online}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={translateText("Fechar conversa", settings.language)}
                onPress={() => setVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.messageList}
              contentContainerStyle={styles.messageContent}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.type === "user" && styles.userMessageRow,
                  ]}
                >
                  <Text
                    style={[
                      styles.message,
                      message.type === "user" ? styles.userMessage : styles.botMessage,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              ))}
              {loading ? (
                <View style={styles.typing}>
                  <ActivityIndicator size="small" color="#ef4444" />
                  <Text style={styles.typingText}>Digitando...</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  disabled={loading}
                  onPress={() => sendMessage(suggestion)}
                  style={styles.suggestion}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.composer}>
              <TextInput
                accessibilityLabel={translateText("Mensagem para o assistente", settings.language)}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => sendMessage()}
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#858585"
                returnKeyType="send"
                editable={!loading}
                style={styles.input}
              />
              <TouchableOpacity
                accessibilityLabel={translateText("Enviar mensagem", settings.language)}
                disabled={loading || !input.trim()}
                onPress={() => sendMessage()}
                style={[styles.sendButton, (!input.trim() || loading) && styles.disabledButton]}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    right: 18,
    bottom: 84,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#d71920",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  panel: {
    width: Math.min(width - 32, 380),
    height: Math.min(height * 0.76, 600),
    maxHeight: "90%",
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#303030",
  },
  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#292929",
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, marginLeft: 10 },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  subtitle: { color: "#c4c4c4", fontSize: 11, marginTop: 3 },
  online: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ade80", marginRight: 5 },
  onlineText: { color: "#e5e5e5", fontSize: 10 },
  closeButton: { padding: 4 },
  messageList: { flex: 1, backgroundColor: "#090909" },
  messageContent: { padding: 14, gap: 12 },
  messageRow: { flexDirection: "row", justifyContent: "flex-start" },
  userMessageRow: { justifyContent: "flex-end" },
  message: { maxWidth: "84%", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 16, color: "#f5f5f5", fontSize: 13, lineHeight: 19 },
  botMessage: { backgroundColor: "#242424", borderBottomLeftRadius: 4 },
  userMessage: { backgroundColor: "#a9141b", borderBottomRightRadius: 4 },
  typing: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { color: "#aaa", fontSize: 12 },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: "#292929" },
  suggestion: { borderWidth: 1, borderColor: "#414141", backgroundColor: "#242424", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 },
  suggestionText: { color: "#f0f0f0", fontSize: 11, textTransform: "capitalize" },
  composer: { flexDirection: "row", alignItems: "center", gap: 9, padding: 12, backgroundColor: "#111", borderTopWidth: 1, borderTopColor: "#292929" },
  input: { flex: 1, minHeight: 44, maxHeight: 88, color: "#fff", fontSize: 14, backgroundColor: "#202020", borderWidth: 1, borderColor: "#393939", borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10 },
  sendButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#d71920" },
  disabledButton: { opacity: 0.5 },
});