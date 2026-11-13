import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import {
  AccessibleText as Text,
  AccessibleTextInput as TextInput,
} from "@/components/AccessibleText";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedAlert } from "@/hooks/useLocalizedAlert";
import { api, endpoints } from "@/services/api";

type BackendVeiculo = {
  id: number;
  modeloVeiculo?: string;
  marcaVeiculo?: string;
  anoVeiculo?: string;
  corVeiculo?: string;
  chassiVeiculo?: string;
  motorVeiculo?: string;
  combustivelVeiculo?: string;
  cambioVeiculo?: string;
  fotoCarroUrl?: string;
  statusVeiculo?: string;
  progressoVeiculo?: number;
  valorTotal?: number;
  valorEntrada?: number;
  valorFinanciado?: number;
  parcelasTotais?: number;
  parcelasPagas?: number;
  parcelasRestantes?: number;
  valorParcela?: number;
  taxaJuros?: number;
  statusFinanciamento?: string;
  statusGarantia?: string;
  dataProximaRevisao?: string;
  acessorios?: string;
  vinIot?: string;
};

type BackendCliente = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  veiculos?: BackendVeiculo[];
};

type Vehicle = {
  id: number;
  modelo: string;
  marca: string;
  ano: string;
  cor: string;
  motor: string;
  combustivel: string;
  cambio: string;
  chassi: string;

  valorTotal: string;
  entrada: string;
  valorFinanciado: string;
  valorParcela: string;
  parcelasTotais: string;
  parcelasPagas: string;
  parcelasRestantes: string;
  taxaJuros: string;

  status: string;
  progresso: string;
  acessorios: string;

  statusFinanciamento: string;
  statusGarantia: string;
  proximaRevisao: string;
  vinIot: string;
};

type Client = {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  senhaAcesso: string;
  endereco: string;
  status: "Lead" | "Cliente";
  vehicles: Vehicle[];
};

function gerarSenha() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function initials(nome: string) {
  return nome
    .split(" ")
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatMoneyDisplay(value?: string) {
  if (!value) return "R$ 0,00";

  const clean = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const number = Number(clean);

  if (Number.isNaN(number)) return value;

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toNumber(value: string) {
  if (!value.trim()) return null;

  const clean = value.replace(/\./g, "").replace(",", ".");
  const number = Number(clean);

  if (Number.isNaN(number)) return null;

  return number;
}

function normalizeVehicle(vehicle: BackendVeiculo): Vehicle {
  return {
    id: vehicle.id,
    modelo: vehicle.modeloVeiculo || "",
    marca: vehicle.marcaVeiculo || "Toyota",
    ano: vehicle.anoVeiculo || "",
    cor: vehicle.corVeiculo || "",
    motor: vehicle.motorVeiculo || "",
    combustivel: vehicle.combustivelVeiculo || "",
    cambio: vehicle.cambioVeiculo || "",
    chassi: vehicle.chassiVeiculo || "",

    valorTotal: toText(vehicle.valorTotal),
    entrada: toText(vehicle.valorEntrada),
    valorFinanciado: toText(vehicle.valorFinanciado),
    valorParcela: toText(vehicle.valorParcela),
    parcelasTotais: toText(vehicle.parcelasTotais),
    parcelasPagas: toText(vehicle.parcelasPagas),
    parcelasRestantes: toText(vehicle.parcelasRestantes),
    taxaJuros: toText(vehicle.taxaJuros),

    status: vehicle.statusVeiculo || "Pedido realizado",
    progresso: toText(vehicle.progressoVeiculo || 0),
    acessorios: vehicle.acessorios || "",

    statusFinanciamento: vehicle.statusFinanciamento || "ATIVO",
    statusGarantia: vehicle.statusGarantia || "ATIVA",
    proximaRevisao: vehicle.dataProximaRevisao || "",
    vinIot: vehicle.vinIot || "",
  };
}

function normalizeClient(client: BackendCliente): Client {
  const vehicles = (client.veiculos || []).map(normalizeVehicle);

  return {
    id: client.id,
    nome: client.nome || "",
    telefone: client.telefone || "",
    email: client.email || "",
    cpf: client.cpf || "",
    senhaAcesso: client.senha || "",
    endereco: client.endereco || "",
    status: vehicles.length > 0 ? "Cliente" : "Lead",
    vehicles,
  };
}

export default function Clientes() {
  const Alert = useLocalizedAlert();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isWideForm = width > 650;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [vehiclesModalVisible, setVehiclesModalVisible] = useState(false);
  const [vehicleFormVisible, setVehicleFormVisible] = useState(false);

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [clientForm, setClientForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
    senhaAcesso: "",
    endereco: "",
  });

  const [vehicleForm, setVehicleForm] = useState({
    modelo: "",
    marca: "Toyota",
    ano: "",
    cor: "",
    motor: "",
    combustivel: "",
    cambio: "",
    chassi: "",

    valorTotal: "",
    entrada: "",
    valorFinanciado: "",
    valorParcela: "",
    parcelasTotais: "",
    parcelasPagas: "",
    parcelasRestantes: "",
    taxaJuros: "",

    status: "",
    progresso: "",
    acessorios: "",

    statusFinanciamento: "ATIVO",
    statusGarantia: "ATIVA",
    proximaRevisao: "",
    vinIot: "",
  });

  useFocusEffect(
    useCallback(() => {
      carregarClientes();
    }, [])
  );

  async function carregarClientes() {
    try {
      setLoading(true);

      const response = await api.get<BackendCliente[]>(endpoints.clientes);

      const clientesNormalizados = response.map(normalizeClient);

      setClients(clientesNormalizados);

      if (selectedClient) {
        const clienteAtualizado = clientesNormalizados.find(
          (client) => client.id === selectedClient.id
        );

        if (clienteAtualizado) {
          setSelectedClient(clienteAtualizado);
        }
      }
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível carregar os clientes."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();

    return (
      client.nome.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.telefone.includes(query) ||
      client.cpf.includes(query)
    );
  });

  function openNewClientModal() {
    setEditingClient(null);

    setClientForm({
      nome: "",
      telefone: "",
      email: "",
      cpf: "",
      senhaAcesso: gerarSenha(),
      endereco: "",
    });

    setClientModalVisible(true);
  }

  function openEditClientModal(client: Client) {
    setEditingClient(client);

    setClientForm({
      nome: client.nome,
      telefone: client.telefone,
      email: client.email,
      cpf: client.cpf,
      senhaAcesso: client.senhaAcesso,
      endereco: client.endereco,
    });

    setClientModalVisible(true);
  }

  async function saveClient() {
    const nome = clientForm.nome.trim();
    const email = clientForm.email.trim().toLowerCase();
    const senha = clientForm.senhaAcesso.trim();

    if (!nome || !email || !senha) {
      Alert.alert("Erro", "Nome, e-mail e senha são obrigatórios.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nome,
        email,
        senha,
        cpf: clientForm.cpf.trim(),
        telefone: clientForm.telefone.trim(),
        endereco: clientForm.endereco.trim(),
      };

      if (editingClient) {
        await api.put<BackendCliente>(
          `${endpoints.clientes}/${editingClient.id}`,
          payload
        );

        Alert.alert("Sucesso", "Cliente atualizado com sucesso.");
      } else {
        await api.post<BackendCliente>(endpoints.cadastroCliente, payload);

        Alert.alert(
          "Cliente criado",
          `Acesso do cliente:\n\nE-mail: ${email}\nSenha: ${senha}`
        );
      }

      setClientModalVisible(false);
      setEditingClient(null);
      await carregarClientes();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível salvar o cliente."
      );
    } finally {
      setSaving(false);
    }
  }

  function deleteClient(client: Client) {
    const message = t(
      "Confirma a exclusão de {name} e dos veículos, documentos, agendamentos e pedidos vinculados?",
      { name: client.nome }
    );

    Alert.alert(
      t("Excluir cliente"),
      message,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete<void>(`${endpoints.clientes}/${client.id}`);
              setClients((current) =>
                current.filter(
                  (currentClient) => currentClient.id !== client.id
                )
              );
              Alert.alert(
                t("Cliente excluído"),
                t("O cliente {name} e seus dados vinculados foram excluídos.", {
                  name: client.nome,
                })
              );
            } catch (error: any) {
              Alert.alert(
                "Erro",
                error?.message || "Não foi possível excluir o cliente."
              );
            }
          },
        },
      ]
    );
  }

  function callClient(client: Client) {
    const phone = client.telefone.replace(/\D/g, "");

    if (!phone) {
      Alert.alert(
        "Telefone não informado",
        "Este cliente não possui telefone cadastrado."
      );
      return;
    }

    Linking.openURL(`tel:${phone}`);
  }

  function openVehiclesModal(client: Client) {
    setSelectedClient(client);
    setVehiclesModalVisible(true);
  }

  function goToNewOrder(client: Client) {
    router.push({
      pathname: "/(tabs)/veiculos",
      params: {
        clienteId: String(client.id),
      },
    });
  }

  function openEditVehicleModal(vehicle: Vehicle) {
    setEditingVehicle(vehicle);

    setVehicleForm({
      modelo: vehicle.modelo,
      marca: vehicle.marca,
      ano: vehicle.ano,
      cor: vehicle.cor,
      motor: vehicle.motor,
      combustivel: vehicle.combustivel,
      cambio: vehicle.cambio,
      chassi: vehicle.chassi,

      valorTotal: vehicle.valorTotal,
      entrada: vehicle.entrada,
      valorFinanciado: vehicle.valorFinanciado,
      valorParcela: vehicle.valorParcela,
      parcelasTotais: vehicle.parcelasTotais,
      parcelasPagas: vehicle.parcelasPagas,
      parcelasRestantes: vehicle.parcelasRestantes,
      taxaJuros: vehicle.taxaJuros,

      status: vehicle.status,
      progresso: vehicle.progresso,
      acessorios: vehicle.acessorios,

      statusFinanciamento: vehicle.statusFinanciamento,
      statusGarantia: vehicle.statusGarantia,
      proximaRevisao: vehicle.proximaRevisao,
      vinIot: vehicle.vinIot,
    });

    setVehicleFormVisible(true);
  }

  async function saveVehicle() {
    if (!selectedClient || !editingVehicle) {
      Alert.alert("Erro", "Nenhum veículo selecionado.");
      return;
    }

    if (!vehicleForm.modelo || !vehicleForm.ano) {
      Alert.alert("Erro", "Modelo e ano são obrigatórios.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        clienteId: selectedClient.id,

        modeloVeiculo: vehicleForm.modelo,
        marcaVeiculo: vehicleForm.marca,
        anoVeiculo: vehicleForm.ano,
        corVeiculo: vehicleForm.cor,
        chassiVeiculo: vehicleForm.chassi,
        motorVeiculo: vehicleForm.motor,
        combustivelVeiculo: vehicleForm.combustivel,
        cambioVeiculo: vehicleForm.cambio,

        statusVeiculo: vehicleForm.status,
        progressoVeiculo: toNumber(vehicleForm.progresso),

        valorTotal: toNumber(vehicleForm.valorTotal),
        valorEntrada: toNumber(vehicleForm.entrada),
        valorFinanciado: toNumber(vehicleForm.valorFinanciado),
        valorParcela: toNumber(vehicleForm.valorParcela),
        parcelasTotais: toNumber(vehicleForm.parcelasTotais),
        parcelasPagas: toNumber(vehicleForm.parcelasPagas),
        parcelasRestantes: toNumber(vehicleForm.parcelasRestantes),
        taxaJuros: toNumber(vehicleForm.taxaJuros),

        statusFinanciamento: vehicleForm.statusFinanciamento,
        statusGarantia: vehicleForm.statusGarantia,
        dataProximaRevisao: vehicleForm.proximaRevisao,

        acessorios: vehicleForm.acessorios,
        vinIot: vehicleForm.vinIot,
      };

      await api.put<BackendVeiculo>(
        endpoints.veiculoPorId(editingVehicle.id),
        payload
      );

      setVehicleFormVisible(false);
      setEditingVehicle(null);

      Alert.alert("Sucesso", "Veículo atualizado com sucesso.");

      await carregarClientes();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível atualizar o veículo."
      );
    } finally {
      setSaving(false);
    }
  }

  function deleteVehicle(vehicle: Vehicle) {
    Alert.alert(
      "Excluir veículo",
      `Deseja realmente excluir ${vehicle.modelo}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete<void>(endpoints.veiculoPorId(vehicle.id));
              await carregarClientes();
              Alert.alert("Sucesso", "Veículo excluído com sucesso.");
            } catch (error: any) {
              Alert.alert(
                "Erro",
                error?.message || "Não foi possível excluir o veículo."
              );
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subtext }]}>
          Carregando clientes...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Clientes</Text>

          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {t("{count} clientes cadastrados", { count: clients.length })}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={openNewClientModal}
        >
          <Ionicons name="add" size={25} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.input }]}>
        <Ionicons name="search-outline" size={19} color={colors.subtext} />

        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar cliente..."
          placeholderTextColor={colors.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.clientCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.clientTop}>
              <View style={[styles.avatar, { backgroundColor: colors.box }]}>
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  {initials(item.nome)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.clientName, { color: colors.text }]}>
                  {item.nome}
                </Text>

                <Text style={[styles.clientInfo, { color: colors.subtext }]}>
                  {item.vehicles.length > 0
                    ? `${item.vehicles.length} veículo(s) • ${
                        item.telefone || item.email
                      }`
                    : `Sem veículo • ${item.email}`}
                </Text>
              </View>

              <View style={styles.leadBadge}>
                <Text style={styles.leadText}>{t(item.status)}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <IconButton
                icon="eye-outline"
                color={colors.text}
                background={colors.box}
                onPress={() => openVehiclesModal(item)}
              />

              <IconButton
                icon="car-sport-outline"
                color={colors.text}
                background={colors.box}
                onPress={() => goToNewOrder(item)}
              />

              <IconButton
                icon="create-outline"
                color={colors.text}
                background={colors.box}
                onPress={() => openEditClientModal(item)}
              />

              <IconButton
                icon="trash-outline"
                color={colors.danger}
                background="rgba(239,68,68,0.10)"
                onPress={() => deleteClient(item)}
              />

              <IconButton
                icon="call-outline"
                color={colors.text}
                background={colors.box}
                onPress={() => callClient(item)}
              />
            </View>
          </View>
        )}
      />

      <Modal visible={clientModalVisible} animationType="slide">
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={() => setClientModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingClient ? "Editar cliente" : "Novo cliente"}
            </Text>

            <TouchableOpacity onPress={saveClient} disabled={saving}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>
                {saving ? "Salvando..." : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <InputLabel label="Nome" color={colors.subtext} />

            <Input
              value={clientForm.nome}
              placeholder="Nome completo"
              colors={colors}
              onChangeText={(text) =>
                setClientForm({ ...clientForm, nome: text })
              }
            />

            <InputLabel label="E-mail de acesso" color={colors.subtext} />

            <Input
              value={clientForm.email}
              placeholder="cliente@email.com"
              colors={colors}
              keyboardType="email-address"
              onChangeText={(text) =>
                setClientForm({
                  ...clientForm,
                  email: text.trim().toLowerCase(),
                })
              }
            />

            <InputLabel
              label="Senha de acesso ao app cliente"
              color={colors.subtext}
            />

            <Input
              value={clientForm.senhaAcesso}
              placeholder="Senha temporária"
              colors={colors}
              onChangeText={(text) =>
                setClientForm({ ...clientForm, senhaAcesso: text })
              }
            />

            <InputLabel label="CPF" color={colors.subtext} />

            <Input
              value={clientForm.cpf}
              placeholder="000.000.000-00"
              colors={colors}
              onChangeText={(text) =>
                setClientForm({ ...clientForm, cpf: text })
              }
            />

            <InputLabel label="Telefone" color={colors.subtext} />

            <Input
              value={clientForm.telefone}
              placeholder="(11) 99999-9999"
              colors={colors}
              keyboardType="phone-pad"
              onChangeText={(text) =>
                setClientForm({ ...clientForm, telefone: text })
              }
            />

            <InputLabel label="Endereço" color={colors.subtext} />

            <Input
              value={clientForm.endereco}
              placeholder="Endereço do cliente"
              colors={colors}
              onChangeText={(text) =>
                setClientForm({ ...clientForm, endereco: text })
              }
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={vehiclesModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View
            style={[
              styles.vehiclesModal,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.vehiclesHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vehiclesTitle, { color: colors.text }]}>
                  Veículos de {selectedClient?.nome}
                </Text>

                
              </View>

              <TouchableOpacity onPress={() => setVehiclesModalVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={26}
                  color={colors.subtext}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 430 }}>
              {selectedClient?.vehicles.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  Este cliente ainda não possui veículos vinculados.
                </Text>
              )}

              {selectedClient?.vehicles.map((vehicle) => (
                <View
                  key={vehicle.id}
                  style={[
                    styles.vehicleCard,
                    { backgroundColor: colors.box, borderColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehicleName, { color: colors.text }]}>
                      {vehicle.modelo || "Veículo sem modelo"}
                    </Text>

                    <Text
                      style={[styles.vehicleDetail, { color: colors.subtext }]}
                    >
                      {vehicle.ano || "Sem ano"} • {vehicle.cor || "Sem cor"} •
                      Chassi: {vehicle.chassi || "Não informado"}
                    </Text>

                    <Text
                      style={[styles.vehicleDetail, { color: colors.subtext }]}
                    >
                      Total: {formatMoneyDisplay(vehicle.valorTotal)} • Parcela:{" "}
                      {formatMoneyDisplay(vehicle.valorParcela)}
                    </Text>

                    <Text
                      style={[styles.vehicleStatus, { color: colors.primary }]}
                    >
                      {t(vehicle.status)}
                    </Text>

                    <Text
                      style={[styles.vehicleDetail, { color: colors.subtext }]}
                    >
                      Financiamento: {vehicle.statusFinanciamento}
                    </Text>

                    <Text
                      style={[styles.vehicleDetail, { color: colors.subtext }]}
                    >
                      Garantia: {vehicle.statusGarantia}
                    </Text>

                    {vehicle.proximaRevisao ? (
                      <Text
                        style={[
                          styles.vehicleDetail,
                          { color: colors.subtext },
                        ]}
                      >
                        Próxima revisão: {vehicle.proximaRevisao}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.vehicleActions}>
                    <TouchableOpacity
                      style={[
                        styles.smallAction,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => openEditVehicleModal(vehicle)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.text}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.smallAction,
                        {
                          backgroundColor: colors.danger,
                          borderColor: colors.danger,
                        },
                      ]}
                      onPress={() => deleteVehicle(vehicle)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.vehiclesFooter}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => setVehiclesModalVisible(false)}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: colors.text }]}
                >
                  Fechar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  if (selectedClient) {
                    setVehiclesModalVisible(false);
                    goToNewOrder(selectedClient);
                  }
                }}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Novo pedido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={vehicleFormVisible} animationType="slide">
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.vehicleEditHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <View>
              <Text style={[styles.editTitle, { color: colors.text }]}>
                Editar veículo
              </Text>

              <Text style={[styles.editSubtitle, { color: colors.subtext }]}>
                Atualize os dados técnicos e financeiros.
              </Text>
            </View>

            <TouchableOpacity onPress={() => setVehicleFormVisible(false)}>
              <Ionicons name="close-outline" size={26} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.vehicleEditContent}>
            <View style={styles.editGrid}>
              <EditInput
                label="Modelo"
                value={vehicleForm.modelo}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, modelo: text })
                }
              />

              <EditInput
                label="Marca"
                value={vehicleForm.marca}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, marca: text })
                }
              />

              <EditInput
                label="Ano"
                value={vehicleForm.ano}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, ano: text })
                }
              />

              <EditInput
                label="Cor"
                value={vehicleForm.cor}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, cor: text })
                }
              />

              

              <EditInput
                label="Chassi"
                value={vehicleForm.chassi}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, chassi: text })
                }
              />

              <EditInput
                label="Motor"
                value={vehicleForm.motor}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, motor: text })
                }
              />

              <EditInput
                label="Combustível"
                value={vehicleForm.combustivel}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, combustivel: text })
                }
              />

              <EditInput
                label="Câmbio"
                value={vehicleForm.cambio}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, cambio: text })
                }
              />

              <EditInput
                label="Valor total"
                value={vehicleForm.valorTotal}
                colors={colors}
                wide={isWideForm}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, valorTotal: text })
                }
              />

              <EditInput
                label="Entrada"
                value={vehicleForm.entrada}
                colors={colors}
                wide={isWideForm}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, entrada: text })
                }
              />

              <EditInput
                label="Valor financiado"
                value={vehicleForm.valorFinanciado}
                colors={colors}
                wide={isWideForm}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, valorFinanciado: text })
                }
              />

              <EditInput
                label="Valor parcela"
                value={vehicleForm.valorParcela}
                colors={colors}
                wide={isWideForm}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, valorParcela: text })
                }
              />

              <EditInput
                label="Parcelas totais"
                value={vehicleForm.parcelasTotais}
                colors={colors}
                wide={isWideForm}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, parcelasTotais: text })
                }
              />

              <EditInput
                label="Parcelas pagas"
                value={vehicleForm.parcelasPagas}
                colors={colors}
                wide={isWideForm}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, parcelasPagas: text })
                }
              />

              <EditInput
                label="Parcelas restantes"
                value={vehicleForm.parcelasRestantes}
                colors={colors}
                wide={isWideForm}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, parcelasRestantes: text })
                }
              />

              <EditInput
                label="Taxa de juros"
                value={vehicleForm.taxaJuros}
                colors={colors}
                wide={isWideForm}
                keyboardType="decimal-pad"
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, taxaJuros: text })
                }
              />

              <EditInput
                label="Status veículo"
                value={vehicleForm.status}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, status: text })
                }
              />

              <EditInput
                label="Progresso"
                value={vehicleForm.progresso}
                colors={colors}
                wide={isWideForm}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, progresso: text })
                }
              />

              <EditInput
                label="Status financiamento"
                value={vehicleForm.statusFinanciamento}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({
                    ...vehicleForm,
                    statusFinanciamento: text,
                  })
                }
              />

              <EditInput
                label="Status garantia"
                value={vehicleForm.statusGarantia}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, statusGarantia: text })
                }
              />

              <EditInput
                label="Próxima revisão"
                value={vehicleForm.proximaRevisao}
                colors={colors}
                wide={isWideForm}
                onChangeText={(text) =>
                  setVehicleForm({ ...vehicleForm, proximaRevisao: text })
                }
              />
            </View>

            <InputLabel label="Acessórios" color={colors.text} />

            <TextInput
              value={vehicleForm.acessorios}
              placeholder="Ex: Câmera de ré, Tapetes de borracha"
              placeholderTextColor={colors.subtext}
              onChangeText={(text) =>
                setVehicleForm({ ...vehicleForm, acessorios: text })
              }
              style={[
                styles.editInput,
                {
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            <View style={styles.editFooter}>
              <TouchableOpacity
                style={[styles.cancelEditButton, { borderColor: colors.border }]}
                onPress={() => setVehicleFormVisible(false)}
              >
                <Text style={[styles.cancelEditText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveEditButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: saving ? 0.7 : 1,
                  },
                ]}
                onPress={saveVehicle}
                disabled={saving}
              >
                <Text style={styles.saveEditText}>
                  {saving ? "Salvando..." : "Salvar veículo"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function IconButton({
  icon,
  color,
  background,
  onPress,
}: {
  icon: any;
  color: string;
  background: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.iconButton, { backgroundColor: background }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={19} color={color} />
    </TouchableOpacity>
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
}: {
  value: string;
  placeholder: string;
  colors: any;
  onChangeText: (text: string) => void;
  keyboardType?: any;
}) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor={colors.subtext}
      keyboardType={keyboardType}
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

function EditInput({
  label,
  value,
  colors,
  onChangeText,
  keyboardType,
  wide,
}: {
  label: string;
  value: string;
  colors: any;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  wide: boolean;
}) {
  return (
    <View style={[styles.editInputWrap, { width: wide ? "48%" : "100%" }]}>
      <InputLabel label={label} color={colors.text} />

      <TextInput
        value={value}
        keyboardType={keyboardType}
        placeholderTextColor={colors.subtext}
        onChangeText={onChangeText}
        style={[
          styles.editInput,
          {
            backgroundColor: colors.input,
            color: colors.text,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
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
    marginTop: 12,
    fontSize: 14,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    justifyContent: "center",
    alignItems: "center",
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

  clientCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },

  clientTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontWeight: "bold",
    fontSize: 13,
  },

  clientName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  clientInfo: {
    marginTop: 3,
    fontSize: 12,
  },

  leadBadge: {
    backgroundColor: "rgba(37,99,235,0.2)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  leadText: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "bold",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
    paddingBottom: 80,
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

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: 18,
  },

  vehiclesModal: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    maxHeight: "88%",
  },

  vehiclesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  vehiclesTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  vehiclesSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },

  emptyText: {
    textAlign: "center",
    padding: 30,
    fontSize: 14,
  },

  vehicleCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    gap: 10,
  },

  vehicleName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  vehicleDetail: {
    marginTop: 4,
    fontSize: 12,
  },

  vehicleStatus: {
    marginTop: 5,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "bold",
  },

  vehicleActions: {
    gap: 8,
    justifyContent: "center",
  },

  smallAction: {
    width: 42,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  vehiclesFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    justifyContent: "flex-end",
  },

  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontWeight: "bold",
  },

  primaryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  vehicleEditHeader: {
    padding: 18,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  editTitle: {
    fontSize: 21,
    fontWeight: "bold",
  },

  editSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  vehicleEditContent: {
    padding: 20,
    paddingBottom: 100,
  },

  editGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  editInputWrap: {
    marginBottom: 14,
  },

  editInput: {
    borderWidth: 1,
    borderRadius: 11,
    minHeight: 46,
    paddingHorizontal: 13,
    fontSize: 14,
  },

  editFooter: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelEditButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelEditText: {
    fontWeight: "bold",
  },

  saveEditButton: {
    borderRadius: 12,
    paddingHorizontal: 18,
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center",
  },

  saveEditText: {
    color: "#fff",
    fontWeight: "bold",
  },
});