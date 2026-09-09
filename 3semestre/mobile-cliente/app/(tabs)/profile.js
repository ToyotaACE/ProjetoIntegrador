import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api";

function formatPrice(value) {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  if (!value) return "Data não informada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR");
}

function getUserEmail(user) {
  return user?.email || user?.emailCliente || user?.usuario?.email || "";
}

function getUserName(user) {
  return user?.nome || user?.name || user?.nomeCliente || "Cliente Toyota";
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [cliente, setCliente] = useState(null);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [senhaModalVisible, setSenhaModalVisible] = useState(false);

  const [senhaErro, setSenhaErro] = useState("");
  const [senhaSucesso, setSenhaSucesso] = useState("");

  const [formPerfil, setFormPerfil] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    endereco: "",
  });

  const [formSenha, setFormSenha] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const emailLogado = getUserEmail(user);

  const carregarPerfil = useCallback(async () => {
    try {
      if (!emailLogado) {
        setCliente(user || null);
        return;
      }

      const responseCliente = await fetch(
        `${API_URL}/clientes/${encodeURIComponent(emailLogado)}`
      );

      if (!responseCliente.ok) {
        throw new Error("Não foi possível buscar os dados do cliente.");
      }

      const clienteData = await responseCliente.json();
      setCliente(clienteData);

      if (clienteData?.id) {
        const responseCompras = await fetch(
          `${API_URL}/compras/cliente/${clienteData.id}`
        );

        if (responseCompras.ok) {
          const comprasData = await responseCompras.json();
          setCompras(Array.isArray(comprasData) ? comprasData : []);
        } else {
          setCompras([]);
        }
      }
    } catch (error) {
      console.log("Erro ao carregar perfil:", error);
      Alert.alert(
        "Erro",
        "Não foi possível carregar os dados do perfil agora."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [emailLogado, user]);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarPerfil();
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleIrShop = () => {
    router.push("/(tabs)/shop");
  };

  const abrirModalEditarPerfil = () => {
    const dadosCliente = cliente || user || {};

    setFormPerfil({
      nome: dadosCliente.nome || "",
      email: dadosCliente.email || emailLogado || "",
      cpf: dadosCliente.cpf || "",
      telefone: dadosCliente.telefone || "",
      endereco: dadosCliente.endereco || "",
    });

    setEditModalVisible(true);
  };

  const abrirModalAlterarSenha = () => {
    setFormSenha({
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    });

    setSenhaErro("");
    setSenhaSucesso("");
    setSenhaModalVisible(true);
  };

  const salvarPerfil = async () => {
    try {
      const dadosCliente = cliente || user;

      if (!dadosCliente?.id) {
        Alert.alert("Erro", "Cliente não encontrado.");
        return;
      }

      if (!formPerfil.nome.trim() || !formPerfil.email.trim()) {
        Alert.alert("Atenção", "Nome e email são obrigatórios.");
        return;
      }

      const response = await fetch(`${API_URL}/clientes/${dadosCliente.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formPerfil.nome.trim(),
          email: formPerfil.email.trim(),
          cpf: formPerfil.cpf.trim(),
          telefone: formPerfil.telefone.trim(),
          endereco: formPerfil.endereco.trim(),
          senha: dadosCliente.senha,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar o perfil.");
      }

      const clienteAtualizado = await response.json();

      setCliente(clienteAtualizado);

      await AsyncStorage.setItem(
        "@toyota_ace:user",
        JSON.stringify(clienteAtualizado)
      );

      setEditModalVisible(false);

      Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
    } catch (error) {
      console.log("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    }
  };

  const salvarSenha = async () => {
    try {
      setSenhaErro("");
      setSenhaSucesso("");

      const dadosCliente = cliente || user;

      const senhaAtualDigitada = formSenha.senhaAtual.trim();
      const novaSenhaDigitada = formSenha.novaSenha.trim();
      const confirmarSenhaDigitada = formSenha.confirmarSenha.trim();

      if (!dadosCliente?.id) {
        setSenhaErro("Cliente não encontrado. Faça login novamente.");
        return;
      }

      if (!senhaAtualDigitada || !novaSenhaDigitada || !confirmarSenhaDigitada) {
        setSenhaErro("Preencha todos os campos de senha.");
        return;
      }

      if (!dadosCliente.senha) {
        setSenhaErro(
          "Não foi possível validar a senha atual. Faça login novamente e tente outra vez."
        );
        return;
      }

      if (senhaAtualDigitada !== dadosCliente.senha) {
        setSenhaErro("Senha atual incorreta.");
        return;
      }

      if (novaSenhaDigitada.length < 6) {
        setSenhaErro("A nova senha precisa ter no mínimo 6 caracteres.");
        return;
      }

      if (novaSenhaDigitada === senhaAtualDigitada) {
        setSenhaErro("A nova senha precisa ser diferente da senha atual.");
        return;
      }

      if (novaSenhaDigitada !== confirmarSenhaDigitada) {
        setSenhaErro("As novas senhas não coincidem.");
        return;
      }

      const response = await fetch(`${API_URL}/clientes/${dadosCliente.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: dadosCliente.nome,
          email: dadosCliente.email,
          cpf: dadosCliente.cpf,
          telefone: dadosCliente.telefone,
          endereco: dadosCliente.endereco,
          senha: novaSenhaDigitada,
        }),
      });

      if (!response.ok) {
        setSenhaErro("Não foi possível alterar a senha. Tente novamente.");
        return;
      }

      const clienteAtualizado = await response.json();

      setCliente(clienteAtualizado);

      await AsyncStorage.setItem(
        "@toyota_ace:user",
        JSON.stringify(clienteAtualizado)
      );

      setFormSenha({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });

      setSenhaErro("");
      setSenhaSucesso("Senha alterada com sucesso.");

      setTimeout(() => {
        setSenhaModalVisible(false);
        setSenhaSucesso("");
      }, 1200);
    } catch (error) {
      console.log("Erro ao alterar senha:", error);
      setSenhaErro("Erro inesperado ao alterar a senha.");
    }
  };

  const dadosCliente = cliente || user || {};

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />

        <Text style={[styles.loadingText, { color: theme.subtext }]}>
          Carregando perfil...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Perfil do Cliente
        </Text>

        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Gerencie suas informações pessoais e segurança da conta.
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Dados Pessoais
            </Text>

            <TouchableOpacity
              style={[
                styles.editIconButton,
                {
                  borderColor: theme.box,
                  backgroundColor: theme.background,
                },
              ]}
              onPress={abrirModalEditarPerfil}
            >
              <Ionicons name="pencil-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Ionicons name="person-outline" size={20} color={theme.primary} />

            <View style={styles.infoBox}>
              <Text style={[styles.label, { color: theme.subtext }]}>Nome</Text>

              <Text style={[styles.value, { color: theme.text }]}>
                {dadosCliente.nome || getUserName(user)}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={20} color={theme.primary} />

            <View style={styles.infoBox}>
              <Text style={[styles.label, { color: theme.subtext }]}>Email</Text>

              <Text style={[styles.value, { color: theme.text }]}>
                {dadosCliente.email || emailLogado || "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="card-outline" size={20} color={theme.primary} />

            <View style={styles.infoBox}>
              <Text style={[styles.label, { color: theme.subtext }]}>CPF</Text>

              <Text style={[styles.value, { color: theme.text }]}>
                {dadosCliente.cpf || "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.rowLast}>
            <Ionicons name="call-outline" size={20} color={theme.primary} />

            <View style={styles.infoBox}>
              <Text style={[styles.label, { color: theme.subtext }]}>
                Telefone
              </Text>

              <Text style={[styles.value, { color: theme.text }]}>
                {dadosCliente.telefone || "Não informado"}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Segurança da Conta
          </Text>

          <View style={[styles.securityBox, { borderColor: theme.box }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#22c55e" />

            <View style={styles.infoBox}>
              <Text style={[styles.securityTitle, { color: "#22c55e" }]}>
                Conta protegida
              </Text>

              <Text style={[styles.subinfo, { color: theme.subtext }]}>
                Seu acesso está ativo e protegido por senha.
              </Text>
            </View>
          </View>

          <View style={[styles.securityBox, { borderColor: theme.box }]}>
            <Ionicons name="lock-closed-outline" size={22} color={theme.primary} />

            <View style={styles.infoBox}>
              <Text style={[styles.securityTitle, { color: theme.text }]}>
                Senha de acesso
              </Text>

              <Text style={[styles.subinfo, { color: theme.subtext }]}>
                Altere sua senha periodicamente para manter sua conta segura.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.fullButton, { backgroundColor: theme.primary }]}
            onPress={abrirModalAlterarSenha}
          >
            <Text style={styles.fullButtonText}>Alterar senha</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Compras Toyota Shop
            </Text>

            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeText}>{compras.length}</Text>
            </View>
          </View>

          {compras.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="bag-outline" size={36} color={theme.subtext} />

              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Nenhuma compra realizada
              </Text>

              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                Explore acessórios e produtos exclusivos Toyota.
              </Text>

              <TouchableOpacity
                style={[styles.shopButton, { backgroundColor: theme.primary }]}
                onPress={handleIrShop}
              >
                <Text style={styles.shopButtonText}>Ir para Toyota Shop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            compras.map((compra) => (
              <View
                key={compra.id}
                style={[styles.purchaseBox, { borderColor: theme.box }]}
              >
                <View style={styles.purchaseHeader}>
                  <View style={styles.infoBox}>
                    <Text style={[styles.value, { color: theme.text }]}>
                      Compra #{compra.id}
                    </Text>

                    <Text style={[styles.subinfo, { color: theme.subtext }]}>
                      Data: {formatDate(compra.dataCompra || compra.date)}
                    </Text>
                  </View>

                  <Text style={[styles.purchaseTotal, { color: theme.primary }]}>
                    {formatPrice(compra.valorTotal || compra.total)}
                  </Text>
                </View>

                {compra.status && (
                  <Text style={[styles.subinfo, { color: theme.subtext }]}>
                    Status: {compra.status}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </View>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Editar Perfil
              </Text>

              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.box,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Nome"
              placeholderTextColor={theme.subtext}
              value={formPerfil.nome}
              onChangeText={(text) =>
                setFormPerfil((prev) => ({ ...prev, nome: text }))
              }
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.box,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={theme.subtext}
              value={formPerfil.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) =>
                setFormPerfil((prev) => ({ ...prev, email: text }))
              }
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.box,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="CPF"
              placeholderTextColor={theme.subtext}
              value={formPerfil.cpf}
              onChangeText={(text) =>
                setFormPerfil((prev) => ({ ...prev, cpf: text }))
              }
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.box,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Telefone"
              placeholderTextColor={theme.subtext}
              value={formPerfil.telefone}
              keyboardType="phone-pad"
              onChangeText={(text) =>
                setFormPerfil((prev) => ({ ...prev, telefone: text }))
              }
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.box,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Endereço"
              placeholderTextColor={theme.subtext}
              value={formPerfil.endereco}
              onChangeText={(text) =>
                setFormPerfil((prev) => ({ ...prev, endereco: text }))
              }
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={salvarPerfil}
            >
              <Text style={styles.modalButtonText}>Salvar alterações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={senhaModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSenhaModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Alterar Senha
              </Text>

              <TouchableOpacity onPress={() => setSenhaModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: senhaErro ? "#ef4444" : theme.box,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Senha atual"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              value={formSenha.senhaAtual}
              onChangeText={(text) => {
                setSenhaErro("");
                setSenhaSucesso("");
                setFormSenha((prev) => ({ ...prev, senhaAtual: text }));
              }}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: senhaErro ? "#ef4444" : theme.box,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Nova senha"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              value={formSenha.novaSenha}
              onChangeText={(text) => {
                setSenhaErro("");
                setSenhaSucesso("");
                setFormSenha((prev) => ({ ...prev, novaSenha: text }));
              }}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: senhaErro ? "#ef4444" : theme.box,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Confirmar nova senha"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              value={formSenha.confirmarSenha}
              onChangeText={(text) => {
                setSenhaErro("");
                setSenhaSucesso("");
                setFormSenha((prev) => ({ ...prev, confirmarSenha: text }));
              }}
            />

            {senhaErro ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{senhaErro}</Text>
              </View>
            ) : null}

            {senhaSucesso ? (
              <View style={styles.successBox}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#16a34a"
                />
                <Text style={styles.successText}>{senhaSucesso}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={salvarSenha}
            >
              <Text style={styles.modalButtonText}>Redefinir senha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: "#ef4444" }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />

        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>

      <Text style={[styles.footer, { color: theme.subtext }]}>
        © {new Date().getFullYear()} Toyota do Brasil
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },

  grid: {
    gap: 12,
  },

  card: {
    padding: 16,
    borderRadius: 14,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 14,
  },

  editIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },

  rowLast: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  infoBox: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    marginBottom: 2,
  },

  value: {
    fontSize: 14,
    fontWeight: "bold",
  },

  subinfo: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },

  securityBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  securityTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },

  fullButton: {
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 2,
  },

  fullButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 28,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 12,
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  shopButton: {
    marginTop: 16,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8,
  },

  shopButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },

  purchaseBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },

  purchaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  purchaseTotal: {
    fontSize: 14,
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },

  errorText: {
    flex: 1,
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },

  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },

  successText: {
    flex: 1,
    color: "#166534",
    fontSize: 13,
    fontWeight: "600",
  },

  modalButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },

  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },

  footer: {
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
  },
});