import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api";

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const paymentMethods = [
  {
    id: "credito",
    label: "Cartão de crédito",
    icon: "card-outline",
  },
  {
    id: "pix",
    label: "PIX",
    icon: "qr-code-outline",
  },
  {
    id: "boleto",
    label: "Boleto",
    icon: "document-text-outline",
  },
];

function getMesPagoKey(veiculoId) {
  return `toyota_ultimo_mes_pago_${veiculoId}`;
}

function formatCurrency(value) {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getUserEmail(user) {
  return user?.email || user?.emailCliente || user?.usuario?.email || "";
}

function getVehicleName(vehicle) {
  return (
    vehicle?.modeloVeiculo ||
    vehicle?.modelo ||
    vehicle?.nome ||
    "Veículo Toyota"
  );
}

function getVehicleYear(vehicle) {
  return vehicle?.anoVeiculo || vehicle?.ano || "";
}

function getVehicleColor(vehicle) {
  return vehicle?.corVeiculo || vehicle?.cor || "Cor não informada";
}

function getValorTotal(vehicle) {
  return Number(vehicle?.valorTotal || 0);
}

function getValorEntrada(vehicle) {
  return Number(vehicle?.valorEntrada || vehicle?.entrada || 0);
}

function getValorFinanciado(vehicle) {
  return Number(
    vehicle?.valorFinanciado ||
      getValorTotal(vehicle) - getValorEntrada(vehicle) ||
      0
  );
}

function getParcelasTotais(vehicle) {
  return Number(vehicle?.parcelasTotais || vehicle?.parcelas || 48);
}

function getParcelasPagas(vehicle) {
  return Number(vehicle?.parcelasPagas || 0);
}

function getParcelasRestantes(vehicle) {
  const restantesBackend = Number(vehicle?.parcelasRestantes);

  if (!Number.isNaN(restantesBackend) && restantesBackend >= 0) {
    return restantesBackend;
  }

  return Math.max(getParcelasTotais(vehicle) - getParcelasPagas(vehicle), 0);
}

function getValorParcela(vehicle) {
  const valorParcela = Number(vehicle?.valorParcela || 0);

  if (valorParcela > 0) {
    return valorParcela;
  }

  const restantes = getParcelasRestantes(vehicle);
  const financiado = getValorFinanciado(vehicle);

  if (restantes <= 0) {
    return 0;
  }

  return financiado / restantes;
}

function getTaxaJuros(vehicle) {
  return Number(vehicle?.taxaJuros || vehicle?.taxa || 1.49);
}

export default function FinancingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [cliente, setCliente] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credito");
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [paying, setPaying] = useState(false);

  const [ultimoMesPago, setUltimoMesPago] = useState("Janeiro");

  const emailLogado = getUserEmail(user);

  const selectedVehicle = useMemo(() => {
    if (!vehicles.length) {
      return null;
    }

    return (
      vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ||
      vehicles[0]
    );
  }, [vehicles, selectedVehicleId]);

  const valorTotal = getValorTotal(selectedVehicle);
  const valorEntrada = getValorEntrada(selectedVehicle);
  const valorFinanciado = getValorFinanciado(selectedVehicle);
  const parcelasTotais = getParcelasTotais(selectedVehicle);
  const parcelasPagas = getParcelasPagas(selectedVehicle);
  const parcelasRestantes = getParcelasRestantes(selectedVehicle);
  const valorParcela = getValorParcela(selectedVehicle);
  const taxaJuros = getTaxaJuros(selectedVehicle);

  const percentualEntrada =
    valorTotal > 0 ? Math.round((valorEntrada / valorTotal) * 100) : 0;

  const carregarUltimoMesPago = useCallback(async () => {
    if (!selectedVehicle?.id) {
      setUltimoMesPago("Janeiro");
      return;
    }

    try {
      const mesSalvo = await AsyncStorage.getItem(
        getMesPagoKey(selectedVehicle.id)
      );

      setUltimoMesPago(mesSalvo || "Janeiro");
    } catch (error) {
      console.log("Erro ao carregar último mês pago:", error);
      setUltimoMesPago("Janeiro");
    }
  }, [selectedVehicle?.id]);

  useEffect(() => {
    carregarUltimoMesPago();
  }, [carregarUltimoMesPago]);

  const carregarFinanciamento = useCallback(async () => {
    try {
      if (!emailLogado) {
        setVehicles([]);
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

      const veiculosCliente = Array.isArray(clienteData?.veiculos)
        ? clienteData.veiculos
        : [];

      setVehicles(veiculosCliente);

      if (veiculosCliente.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(veiculosCliente[0].id);
      }
    } catch (error) {
      console.log("Erro ao carregar financiamento:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [emailLogado, selectedVehicleId]);

  useEffect(() => {
    carregarFinanciamento();
  }, [carregarFinanciamento]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarFinanciamento();
  };

  const abrirModalPagamento = () => {
    setPaymentMethod("credito");
    setPaymentError("");
    setPaymentSuccess("");
    setPaymentModalVisible(true);
  };

  const avancarMes = () => {
    const indexAtual = meses.indexOf(ultimoMesPago);

    if (indexAtual < 0) {
      return "Fevereiro";
    }

    const proximoIndex = (indexAtual + 1) % meses.length;
    return meses[proximoIndex];
  };

  const confirmarPagamento = async () => {
    try {
      setPaymentError("");
      setPaymentSuccess("");

      if (!selectedVehicle?.id) {
        setPaymentError("Nenhum veículo selecionado.");
        return;
      }

      if (parcelasRestantes <= 0 || valorFinanciado <= 0) {
        setPaymentError("Este financiamento já está quitado.");
        return;
      }

      if (!paymentMethod) {
        setPaymentError("Escolha uma forma de pagamento.");
        return;
      }

      setPaying(true);

      const novoValorFinanciado = Math.max(valorFinanciado - valorParcela, 0);
      const novasParcelasPagas = parcelasPagas + 1;
      const novasParcelasRestantes = Math.max(parcelasRestantes - 1, 0);
      const novoMesPago = avancarMes();

      const veiculoAtualizado = {
        ...selectedVehicle,
        valorFinanciado: Number(novoValorFinanciado.toFixed(2)),
        parcelasPagas: novasParcelasPagas,
        parcelasRestantes: novasParcelasRestantes,
        statusFinanciamento:
          novasParcelasRestantes === 0 ? "QUITADO" : "ATIVO",
      };

      const response = await fetch(`${API_URL}/veiculos/${selectedVehicle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(veiculoAtualizado),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar o financiamento.");
      }

      const data = await response.json();

      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === selectedVehicle.id ? data : vehicle
        )
      );

      await AsyncStorage.setItem(getMesPagoKey(selectedVehicle.id), novoMesPago);

      setUltimoMesPago(novoMesPago);
      setPaymentSuccess("Pagamento confirmado com sucesso.");

      setTimeout(() => {
        setPaymentModalVisible(false);
        setPaymentSuccess("");
      }, 1200);
    } catch (error) {
      console.log("Erro ao pagar parcela:", error);
      setPaymentError("Não foi possível confirmar o pagamento.");
    } finally {
      setPaying(false);
    }
  };

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
          Carregando financiamento...
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
          Financiamento
        </Text>

        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Veja e simule o pagamento das parcelas por veículo.
        </Text>
      </View>

      {vehicles.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
          <Ionicons name="car-outline" size={36} color={theme.subtext} />

          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Nenhum veículo encontrado
          </Text>

          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            Não encontramos veículos vinculados ao seu perfil.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Veículos
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vehicleList}
          >
            {vehicles.map((vehicle) => {
              const selected = selectedVehicle?.id === vehicle.id;

              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: selected ? theme.primary : theme.box,
                    },
                  ]}
                  onPress={() => setSelectedVehicleId(vehicle.id)}
                >
                  <View
                    style={[
                      styles.vehicleIconBox,
                      {
                        backgroundColor: selected
                          ? theme.primary
                          : theme.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name="car-sport-outline"
                      size={26}
                      color={selected ? "#fff" : theme.primary}
                    />
                  </View>

                  <Text
                    style={[styles.vehicleName, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {getVehicleName(vehicle)}
                  </Text>

                  <Text style={[styles.vehicleSub, { color: theme.subtext }]}>
                    {getVehicleYear(vehicle)} • {getVehicleColor(vehicle)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.grid}>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="cash-outline" size={20} color={theme.primary} />
                </View>

                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Valor Total
                </Text>
              </View>

              <Text style={[styles.cardMain, { color: theme.text }]}>
                {formatCurrency(valorTotal)}
              </Text>

              <Text style={[styles.cardSub, { color: theme.subtext }]}>
                {getVehicleName(selectedVehicle)}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="card-outline" size={20} color={theme.primary} />
                </View>

                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Entrada
                </Text>
              </View>

              <Text style={[styles.cardMain, { color: theme.text }]}>
                {formatCurrency(valorEntrada)}
              </Text>

              <Text style={[styles.cardSub, { color: theme.subtext }]}>
                {percentualEntrada}% do valor
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>

                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Parcelas
                </Text>
              </View>

              <Text style={[styles.cardMain, { color: theme.text }]}>
                {parcelasTotais}x de {formatCurrency(valorParcela)}
              </Text>

              <Text style={[styles.cardSub, { color: theme.subtext }]}>
                {parcelasPagas} pagas • {parcelasRestantes} restantes
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name="wallet-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>

                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Valor Pendente
                </Text>
              </View>

              <Text style={[styles.cardMain, { color: theme.text }]}>
                {formatCurrency(valorFinanciado)}
              </Text>

              <Text style={[styles.cardSub, { color: theme.subtext }]}>
                Último mês pago: {ultimoMesPago}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name="trending-up-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>

                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Taxa de Juros
                </Text>
              </View>

              <Text style={[styles.cardMain, { color: theme.text }]}>
                {taxaJuros}% a.m.
              </Text>

              <Text style={[styles.cardSub, { color: theme.subtext }]}>
                {(taxaJuros * 12).toFixed(2)}% ao ano
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>

                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Garantia
                </Text>
              </View>

              <Text style={[styles.cardMain, { color: theme.text }]}>
                {selectedVehicle?.statusGarantia || "ATIVA"}
              </Text>

              <Text style={[styles.cardSub, { color: theme.subtext }]}>
                Financiamento:{" "}
                {selectedVehicle?.statusFinanciamento || "ATIVO"}
              </Text>
            </View>
          </View>

          <View style={[styles.paymentCard, { backgroundColor: theme.card }]}>
            <View>
              <Text style={[styles.paymentTitle, { color: theme.text }]}>
                Pagamento simulado
              </Text>

              <Text style={[styles.paymentSub, { color: theme.subtext }]}>
                Próxima parcela
              </Text>

              <Text style={[styles.paymentValue, { color: theme.text }]}>
                {formatCurrency(valorParcela)}
              </Text>

              <Text style={[styles.paymentDescription, { color: theme.subtext }]}>
                Escolha a forma de pagamento e confirme para dar baixa na parcela.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.payButton,
                {
                  backgroundColor:
                    parcelasRestantes <= 0 ? theme.box : theme.primary,
                },
              ]}
              disabled={parcelasRestantes <= 0}
              onPress={abrirModalPagamento}
            >
              <Text style={styles.payButtonText}>
                {parcelasRestantes <= 0 ? "Quitado" : "Pagar parcela"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Pagamento da parcela
              </Text>

              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.subtext }]}>
              Valor da parcela
            </Text>

            <Text style={[styles.modalValue, { color: theme.text }]}>
              {formatCurrency(valorParcela)}
            </Text>

            <Text style={[styles.modalLabel, { color: theme.subtext }]}>
              Forma de pagamento
            </Text>

            <View style={styles.paymentMethods}>
              {paymentMethods.map((method) => {
                const selected = paymentMethod === method.id;

                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethod,
                      {
                        borderColor: selected ? theme.primary : theme.box,
                        backgroundColor: selected
                          ? theme.primary
                          : theme.background,
                      },
                    ]}
                    onPress={() => {
                      setPaymentMethod(method.id);
                      setPaymentError("");
                    }}
                  >
                    <Ionicons
                      name={method.icon}
                      size={20}
                      color={selected ? "#fff" : theme.text}
                    />

                    <Text
                      style={[
                        styles.paymentMethodText,
                        { color: selected ? "#fff" : theme.text },
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {paymentError ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#ef4444"
                />

                <Text style={styles.errorText}>{paymentError}</Text>
              </View>
            ) : null}

            {paymentSuccess ? (
              <View style={styles.successBox}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#16a34a"
                />

                <Text style={styles.successText}>{paymentSuccess}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.box }]}
                onPress={() => setPaymentModalVisible(false)}
                disabled={paying}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                onPress={confirmarPagamento}
                disabled={paying}
              >
                {paying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Confirmar pagamento
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

  content: {
    padding: 16,
    paddingBottom: 36,
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

  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  vehicleList: {
    gap: 10,
    paddingBottom: 14,
  },

  vehicleCard: {
    width: 145,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },

  vehicleIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  vehicleName: {
    fontSize: 14,
    fontWeight: "bold",
  },

  vehicleSub: {
    marginTop: 4,
    fontSize: 12,
  },

  grid: {
    gap: 12,
  },

  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },

  cardMain: {
    fontSize: 20,
    fontWeight: "bold",
  },

  cardSub: {
    marginTop: 4,
    fontSize: 13,
  },

  paymentCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },

  paymentTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 14,
  },

  paymentSub: {
    fontSize: 13,
  },

  paymentValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 3,
  },

  paymentDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },

  payButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  payButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "bold",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
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
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  modalLabel: {
    fontSize: 13,
    marginTop: 10,
  },

  modalValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 3,
    marginBottom: 8,
  },

  paymentMethods: {
    gap: 10,
    marginTop: 10,
  },

  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
  },

  paymentMethodText: {
    fontSize: 14,
    fontWeight: "bold",
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
    marginTop: 14,
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
    marginTop: 14,
  },

  successText: {
    flex: 1,
    color: "#166534",
    fontSize: 13,
    fontWeight: "600",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelButtonText: {
    fontWeight: "bold",
  },

  confirmButton: {
    flex: 1.4,
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  footer: {
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
    fontSize: 12,
  },
});