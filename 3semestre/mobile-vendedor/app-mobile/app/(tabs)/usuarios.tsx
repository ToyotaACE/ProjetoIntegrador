import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AccessibleText as Text,
  AccessibleTextInput as TextInput,
} from "@/components/AccessibleText";
import { useLanguage } from "@/contexts/LanguageContext";
import { PerfilUsuario, UsuarioInterno, useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedAlert } from "@/hooks/useLocalizedAlert";
import { api, endpoints } from "@/services/api";

type UserForm = {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
  ativo: boolean;
};

function formatDate(date?: string) {
  if (!date) return "Sem data";

  if (date.includes("-")) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  return date;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Usuarios() {
  const Alert = useLocalizedAlert();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, isAdmin, recarregarUsuarios } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioInterno[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioInterno | null>(null);

  const [form, setForm] = useState<UserForm>({
    nome: "",
    email: "",
    senha: "",
    perfil: "VENDEDOR",
    ativo: true,
  });

  useFocusEffect(
    useCallback(() => {
      carregarUsuarios();
    }, [])
  );

  async function carregarUsuarios() {
    try {
      setLoading(true);

      const response = await api.get<UsuarioInterno[]>(endpoints.usuarios);

      setUsuarios(response);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível carregar os usuários."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = usuarios.filter((usuario) => {
    const query = searchQuery.toLowerCase();

    return (
      usuario.nome.toLowerCase().includes(query) ||
      usuario.email.toLowerCase().includes(query) ||
      usuario.perfil.toLowerCase().includes(query)
    );
  });

  function openNewUserModal() {
    setEditingUser(null);

    setForm({
      nome: "",
      email: "",
      senha: "",
      perfil: "VENDEDOR",
      ativo: true,
    });

    setModalVisible(true);
  }

  function openEditUserModal(usuario: UsuarioInterno) {
    setEditingUser(usuario);

    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: "",
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    });

    setModalVisible(true);
  }

  async function saveUser() {
    const nome = form.nome.trim();
    const email = form.email.trim().toLowerCase();
    const senha = form.senha.trim();

    if (!nome || !email) {
      Alert.alert("Erro", "Nome e e-mail são obrigatórios.");
      return;
    }

    if (!editingUser && !senha) {
      Alert.alert("Erro", "Senha é obrigatória para novo usuário.");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        nome,
        email,
        perfil: form.perfil,
        ativo: form.ativo,
      };

      if (senha) {
        payload.senha = senha;
      }

      if (editingUser) {
        await api.put<UsuarioInterno>(
          endpoints.usuarioPorId(editingUser.id),
          payload
        );

        Alert.alert("Sucesso", "Usuário atualizado com sucesso.");
      } else {
        await api.post<UsuarioInterno>(endpoints.usuarios, payload);

        Alert.alert("Sucesso", "Usuário criado com sucesso.");
      }

      setModalVisible(false);
      setEditingUser(null);

      await carregarUsuarios();
      await recarregarUsuarios();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível salvar o usuário."
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDisableUser(usuario: UsuarioInterno) {
    if (user?.id === usuario.id) {
      Alert.alert(
        "Ação bloqueada",
        "Você não pode desativar o próprio usuário logado."
      );
      return;
    }

    Alert.alert(
      "Desativar usuário",
      `Deseja realmente desativar ${usuario.nome}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Desativar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete<void>(endpoints.usuarioPorId(usuario.id));

              await carregarUsuarios();
              await recarregarUsuarios();

              Alert.alert("Sucesso", "Usuário desativado com sucesso.");
            } catch (error: any) {
              Alert.alert(
                "Erro",
                error?.message || "Não foi possível desativar o usuário."
              );
            }
          },
        },
      ]
    );
  }

  async function toggleUserStatus(usuario: UsuarioInterno) {
    if (user?.id === usuario.id && usuario.ativo) {
      Alert.alert(
        "Ação bloqueada",
        "Você não pode desativar o próprio usuário logado."
      );
      return;
    }

    try {
      const novoStatus = !usuario.ativo;

      await api.put<UsuarioInterno>(endpoints.usuarioPorId(usuario.id), {
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: novoStatus,
      });

      await carregarUsuarios();
      await recarregarUsuarios();

      Alert.alert(
        "Sucesso",
        novoStatus
          ? "Usuário ativado com sucesso."
          : "Usuário desativado com sucesso."
      );
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível alterar o status do usuário."
      );
    }
  }

  if (!isAdmin) {
    return (
      <SafeAreaView
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Ionicons name="lock-closed-outline" size={42} color={colors.primary} />

        <Text style={[styles.blockTitle, { color: colors.text }]}>
          Acesso restrito
        </Text>

        <Text style={[styles.blockText, { color: colors.subtext }]}>
          Apenas administradores podem gerenciar usuários.
        </Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={[styles.loadingText, { color: colors.subtext }]}>
          Carregando usuários...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>
            Gerenciar Usuários
          </Text>

          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {t("{count} usuário(s) interno(s)", { count: usuarios.length })}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={openNewUserModal}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.input }]}>
        <Ionicons name="search-outline" size={19} color={colors.subtext} />

        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar usuário..."
          placeholderTextColor={colors.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isCurrentUser = user?.id === item.id;

          return (
            <View
              style={[
                styles.userCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: item.ativo ? 1 : 0.62,
                },
              ]}
            >
              <View style={styles.userTop}>
                <View style={[styles.avatar, { backgroundColor: colors.box }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>
                    {getInitials(item.nome)}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {item.nome}
                    </Text>

                    {isCurrentUser ? (
                      <View
                        style={[
                          styles.meBadge,
                          { backgroundColor: "rgba(59,130,246,0.18)" },
                        ]}
                      >
                        <Text style={styles.meBadgeText}>Você</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.userEmail, { color: colors.subtext }]}>
                    {item.email}
                  </Text>

                  <Text style={[styles.userDate, { color: colors.subtext }]}>
                    {t("Criado em")} {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.profileBadge,
                    {
                      backgroundColor:
                        item.perfil === "ADMIN"
                          ? "rgba(230,0,18,0.18)"
                          : "rgba(37,99,235,0.18)",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      item.perfil === "ADMIN"
                        ? "shield-checkmark-outline"
                        : "person-outline"
                    }
                    size={14}
                    color={item.perfil === "ADMIN" ? colors.primary : "#60A5FA"}
                  />

                  <Text
                    style={[
                      styles.profileBadgeText,
                      {
                        color:
                          item.perfil === "ADMIN"
                            ? colors.primary
                            : "#60A5FA",
                      },
                    ]}
                  >
                    {t(item.perfil === "ADMIN" ? "Administrador" : "Vendedor")}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: item.ativo
                        ? "rgba(22,163,74,0.16)"
                        : "rgba(239,68,68,0.14)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.ativo ? "#22C55E" : colors.danger },
                    ]}
                  >
                    {item.ativo ? "ATIVO" : "INATIVO"}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.box },
                  ]}
                  onPress={() => openEditUserModal(item)}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.text}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: item.ativo
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(22,163,74,0.14)",
                    },
                  ]}
                  onPress={() => toggleUserStatus(item)}
                >
                  <Ionicons
                    name={
                      item.ativo
                        ? "close-circle-outline"
                        : "checkmark-circle-outline"
                    }
                    size={18}
                    color={item.ativo ? colors.danger : "#22C55E"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: "rgba(239,68,68,0.12)" },
                  ]}
                  onPress={() => confirmDisableUser(item)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.danger}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="people-outline"
              size={34}
              color={colors.subtext}
            />

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhum usuário encontrado
            </Text>

            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Crie um usuário interno para acessar o app vendedor.
            </Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingUser ? "Editar usuário" : "Novo usuário"}
            </Text>

            <TouchableOpacity onPress={saveUser} disabled={saving}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>
                {saving ? "Salvando..." : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <InputLabel label="Nome" color={colors.subtext} />

            <Input
              value={form.nome}
              placeholder="Nome completo"
              colors={colors}
              onChangeText={(text) => setForm({ ...form, nome: text })}
            />

            <InputLabel label="E-mail" color={colors.subtext} />

            <Input
              value={form.email}
              placeholder="usuario@toyota.com"
              colors={colors}
              keyboardType="email-address"
              onChangeText={(text) =>
                setForm({ ...form, email: text.trim().toLowerCase() })
              }
            />

            <InputLabel
              label={
                editingUser
                  ? "Nova senha — deixe vazio para manter"
                  : "Senha"
              }
              color={colors.subtext}
            />

            <Input
              value={form.senha}
              placeholder={
                editingUser ? "Deixe vazio para não alterar" : "Senha de acesso"
              }
              colors={colors}
              secureTextEntry
              onChangeText={(text) => setForm({ ...form, senha: text })}
            />

            <InputLabel label="Perfil" color={colors.subtext} />

            <View style={styles.profileOptions}>
              <TouchableOpacity
                style={[
                  styles.profileOption,
                  {
                    backgroundColor:
                      form.perfil === "ADMIN"
                        ? "rgba(230,0,18,0.16)"
                        : colors.card,
                    borderColor:
                      form.perfil === "ADMIN" ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setForm({ ...form, perfil: "ADMIN" })}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={form.perfil === "ADMIN" ? colors.primary : colors.text}
                />

                <Text
                  style={[
                    styles.profileOptionText,
                    {
                      color:
                        form.perfil === "ADMIN"
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  ADMIN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.profileOption,
                  {
                    backgroundColor:
                      form.perfil === "VENDEDOR"
                        ? "rgba(37,99,235,0.16)"
                        : colors.card,
                    borderColor:
                      form.perfil === "VENDEDOR" ? "#60A5FA" : colors.border,
                  },
                ]}
                onPress={() => setForm({ ...form, perfil: "VENDEDOR" })}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={form.perfil === "VENDEDOR" ? "#60A5FA" : colors.text}
                />

                <Text
                  style={[
                    styles.profileOptionText,
                    {
                      color:
                        form.perfil === "VENDEDOR" ? "#60A5FA" : colors.text,
                    },
                  ]}
                >
                  VENDEDOR
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.activeBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.activeTitle, { color: colors.text }]}>
                  Usuário ativo
                </Text>

                <Text style={[styles.activeSubtitle, { color: colors.subtext }]}>
                  Usuários inativos não conseguem acessar o app.
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="switch"
                accessibilityState={{ checked: form.ativo }}
                accessibilityLabel="Usuário ativo"
                onPress={() => setForm({ ...form, ativo: !form.ativo })}
                style={{
                  width: 50,
                  height: 30,
                  borderRadius: 15,
                  padding: 3,
                  justifyContent: "center",
                  backgroundColor: form.ativo ? colors.danger : "#52525B",
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#FFFFFF",
                    alignSelf: form.ativo ? "flex-end" : "flex-start",
                  }}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.saveFullButton,
                {
                  backgroundColor: colors.primary,
                  opacity: saving ? 0.7 : 1,
                },
              ]}
              onPress={saveUser}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#fff"
                  />

                  <Text style={styles.saveFullButtonText}>
                    {editingUser ? "Salvar alterações" : "Criar usuário"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function InputLabel({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.inputLabel, { color }]}>{label}</Text>;
}

function Input({
  value,
  placeholder,
  colors,
  onChangeText,
  keyboardType,
  secureTextEntry,
}: {
  value: string;
  placeholder: string;
  colors: any;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  secureTextEntry?: boolean;
}) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor={colors.subtext}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
      onChangeText={onChangeText}
      style={[
        styles.input,
        {
          backgroundColor: colors.input,
          color: colors.text,
          borderColor: colors.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  blockTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 14,
  },

  blockText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    marginHorizontal: 20,
    marginBottom: 14,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  userCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },

  userTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  meBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },

  meBadgeText: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "bold",
  },

  userEmail: {
    marginTop: 3,
    fontSize: 13,
  },

  userDate: {
    marginTop: 2,
    fontSize: 12,
  },

  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    flexWrap: "wrap",
  },

  profileBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  profileBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
  },

  actionButton: {
    width: 40,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 10,
  },

  emptyText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },

  modalContainer: {
    flex: 1,
  },

  modalHeader: {
    padding: 18,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalCancel: {
    fontSize: 15,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  modalSave: {
    fontSize: 15,
    fontWeight: "bold",
  },

  modalContent: {
    padding: 20,
    paddingBottom: 100,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
    marginBottom: 14,
    fontSize: 15,
  },

  profileOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  profileOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  profileOptionText: {
    fontSize: 13,
    fontWeight: "bold",
  },

  activeBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  activeTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },

  activeSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },

  saveFullButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  saveFullButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
