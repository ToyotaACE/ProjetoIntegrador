import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated
} from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar() {
  const router = useRouter();
  const { logout } = useAuth();

  const [open, setOpen] = useState(true);
  const width = useState(new Animated.Value(220))[0];

  const toggleSidebar = () => {
    Animated.timing(width, {
      toValue: open ? 70 : 220,
      duration: 200,
      useNativeDriver: false
    }).start();
    setOpen(!open);
  };

  const navigate = (route) => {
    router.replace(route);
  };

  return (
    <Animated.View style={[styles.sidebar, { width }]}>
      
      {/* BOTÃO TOGGLE */}
      <TouchableOpacity onPress={toggleSidebar}>
        <Text style={styles.toggle}>{open ? "←" : "→"}</Text>
      </TouchableOpacity>

      {/* ITENS */}
      <TouchableOpacity onPress={() => navigate("/dashboard")}>
        <Text style={styles.item}>🏠 {open && "Dashboard"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigate("/vehicle")}>
        <Text style={styles.item}>🚗 {open && "Veículo"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigate("/financing")}>
        <Text style={styles.item}>💰 {open && "Financiamento"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigate("/scheduling")}>
        <Text style={styles.item}>📅 {open && "Agendamento"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigate("/profile")}>
        <Text style={styles.item}>👤 {open && "Perfil"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigate("/shop")}>
        <Text style={styles.item}>👤 {open && "Shop"}</Text>
      </TouchableOpacity>

      {/* LOGOUT */}
      <TouchableOpacity
        onPress={() => {
          logout();
          router.replace("/login");
        }}
      >
        <Text style={[styles.item, { color: "#e11d48" }]}>
          🚪 {open && "Sair"}
        </Text>
      </TouchableOpacity>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: "#111",
    paddingTop: 40,
    paddingHorizontal: 10
  },
  toggle: {
    color: "#fff",
    fontSize: 20,
    marginBottom: 20
  },
  item: {
    color: "#fff",
    paddingVertical: 12,
    fontSize: 14
  }
});