import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

// Imagens locais dentro de app/image
import carroToyota from "../image/carro toyota.jpg";
import yarisHatch from "../image/yaris.png";
import yarisCross from "../image/yarisseda.png";
import sw4 from "../image/sw4.png";

const API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api").replace(/\/api\/?$/, "");
const API_URL = `${API_ORIGIN}/api`;

function getUserEmail(user) {
  return user?.email || user?.emailCliente || user?.usuario?.email || "";
}

function formatCurrency(value) {
  const number = Number(value || 0);

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
  return vehicle?.anoVeiculo || vehicle?.ano || "Ano não informado";
}

function getVehicleColor(vehicle) {
  return vehicle?.corVeiculo || vehicle?.cor || "Cor não informada";
}

function getVehicleImage(vehicle) {
  const name = String(getVehicleName(vehicle)).toLowerCase();

  if (name.includes("yaris cross")) {
    return yarisCross;
  }

  if (name.includes("yaris hatch") || name === "yaris") {
    return yarisHatch;
  }

  if (name.includes("hilux")) {
    return sw4;
  }

  return carroToyota;
}

function getVehicleProgress(vehicle) {
  const progress =
    vehicle?.progressoVeiculo ??
    vehicle?.progresso ??
    vehicle?.progressoFabricacao ??
    0;

  const parsed = Number(progress);

  if (Number.isNaN(parsed)) return 0;
  if (parsed < 0) return 0;
  if (parsed > 100) return 100;

  return parsed;
}

function getVehicleStatus(vehicle) {
  const progress = getVehicleProgress(vehicle);

  if (progress >= 100) {
    return "Pronto para retirada";
  }

  return (
    vehicle?.statusVeiculo ||
    vehicle?.status ||
    vehicle?.statusFabricacao ||
    "Pedido realizado"
  );
}

function getCurrentStep(vehicle) {
  const progress = getVehicleProgress(vehicle);
  const status = String(getVehicleStatus(vehicle)).toLowerCase();

  if (progress >= 100 || status.includes("retirada")) {
    return "Pronto para retirada";
  }

  if (progress >= 83 || status.includes("concession")) {
    return "Concessionária";
  }

  if (progress >= 67 || status.includes("cegonha")) {
    return "Cegonha";
  }

  if (progress >= 50 || status.includes("inspe")) {
    return "Inspeção";
  }

  if (
    progress >= 33 ||
    status.includes("linha") ||
    status.includes("produção") ||
    status.includes("producao")
  ) {
    return "Linha de produção";
  }

  if (progress >= 17 || status.includes("pedido")) {
    return "Pedido realizado";
  }

  return "Aguardando início";
}

function getProgressColor(progress, theme) {
  if (progress >= 100) {
    return "#22c55e";
  }

  return theme.primary;
}

function getNextReview(vehicle) {
  return (
    vehicle?.dataProximaRevisao ||
    vehicle?.proximaRevisao ||
    "Não informada"
  );
}

function getInstallmentValue(vehicle) {
  return Number(vehicle?.valorParcela || 0);
}

function getRemainingInstallments(vehicle) {
  return Number(vehicle?.parcelasRestantes || 0);
}

function getWarrantyStatus(vehicle) {
  return vehicle?.statusGarantia || "ATIVA";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [client, setClient] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emailLogado = getUserEmail(user);

  const selectedVehicle = useMemo(() => {
    if (!vehicles.length) return null;

    return (
      vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ||
      vehicles[0]
    );
  }, [vehicles, selectedVehicleId]);

  const clientName = client?.nome || user?.name || user?.nome || "Usuário";

  const progress = getVehicleProgress(selectedVehicle);
  const progressColor = getProgressColor(progress, theme);
  const vehicleName = getVehicleName(selectedVehicle);
  const vehicleStatus = getVehicleStatus(selectedVehicle);
  const currentStep = getCurrentStep(selectedVehicle);

  const carregarDashboard = useCallback(
    async (silent = false) => {
      try {
        setErrorMessage("");

        if (!emailLogado) {
          setClient(null);
          setVehicles([]);
          setErrorMessage("Cliente não identificado. Faça login novamente.");
          return;
        }

        if (silent) {
          setUpdating(true);
        }

        const response = await fetch(
          `${API_URL}/clientes/${encodeURIComponent(emailLogado)}`
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar dados do cliente.");
        }

        const data = await response.json();

        const veiculosCliente = Array.isArray(data?.veiculos)
          ? data.veiculos
          : [];

        setClient(data);
        setVehicles(veiculosCliente);

        if (veiculosCliente.length > 0) {
          const selectedStillExists = veiculosCliente.some(
            (vehicle) => vehicle.id === selectedVehicleId
          );

          if (!selectedVehicleId || !selectedStillExists) {
            setSelectedVehicleId(veiculosCliente[0].id);
          }
        } else {
          setSelectedVehicleId(null);
        }
      } catch (error) {
        console.log("Erro ao carregar dashboard:", error);
        setErrorMessage("Não foi possível carregar os dados da Home.");
      } finally {
        setLoading(false);
        setUpdating(false);
        setRefreshing(false);
      }
    },
    [emailLogado, selectedVehicleId]
  );

  useEffect(() => {
    carregarDashboard(false);
  }, [carregarDashboard]);

  useEffect(() => {
    const interval = setInterval(() => {
      carregarDashboard(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [carregarDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarDashboard(false);
  };

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
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
          Carregando Home...
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
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              Olá, {clientName} 👋
            </Text>

            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Bem-vindo ao seu portal Toyota ACE.
            </Text>
          </View>

          {updating ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : null}
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {selectedVehicle ? (
        <>
          <View style={[styles.heroCard, { backgroundColor: theme.card }]}>
            <View style={styles.heroInfo}>
              <View style={styles.heroLabelRow}>
                <Text style={[styles.heroLabel, { color: theme.primary }]}>
                  Veículo principal
                </Text>

                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: progressColor },
                  ]}
                >
                  <Text style={styles.statusChipText}>{vehicleStatus}</Text>
                </View>
              </View>

              <Text style={[styles.heroTitle, { color: theme.text }]}>
                {vehicleName}
              </Text>

              <Text style={[styles.heroSub, { color: theme.subtext }]}>
                {getVehicleYear(selectedVehicle)} •{" "}
                {getVehicleColor(selectedVehicle)}
              </Text>

              {vehicles.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.vehicleSelector}
                >
                  {vehicles.map((vehicle) => {
                    const selected = selectedVehicle?.id === vehicle.id;

                    return (
                      <TouchableOpacity
                        key={vehicle.id}
                        onPress={() => handleSelectVehicle(vehicle.id)}
                        style={[
                          styles.selectorButton,
                          {
                            backgroundColor: selected
                              ? theme.primary
                              : "transparent",
                            borderColor: selected ? theme.primary : theme.box,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectorText,
                            {
                              color: selected ? "#fff" : theme.text,
                            },
                          ]}
                        >
                          {getVehicleName(vehicle)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}

              <View style={styles.stageBox}>
                <View>
                  <Text style={[styles.stageLabel, { color: theme.subtext }]}>
                    Etapa atual
                  </Text>

                  <Text style={[styles.stageValue, { color: theme.text }]}>
                    {currentStep}
                  </Text>
                </View>

                <Text style={[styles.stagePercent, { color: progressColor }]}>
                  {progress}%
                </Text>
              </View>

              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: theme.progressBg || theme.box },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: progressColor,
                    },
                  ]}
                />
              </View>

              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={[
                    styles.primaryAction,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => router.push("/vehicle")}
                >
                  <Text style={styles.primaryActionText}>Ver veículo</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryAction, { borderColor: theme.box }]}
                  onPress={() => router.push("/financing")}
                >
                  <Text
                    style={[
                      styles.secondaryActionText,
                      { color: theme.text },
                    ]}
                  >
                    Financiamento
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroImageArea}>
              <Image
                source={getVehicleImage(selectedVehicle)}
                style={styles.heroImage}
              />
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard
              theme={theme}
              icon="car-sport-outline"
              title="Veículos"
              value={String(vehicles.length)}
              description="vinculado(s)"
            />

            <SummaryCard
              theme={theme}
              icon="card-outline"
              title="Próxima parcela"
              value={formatCurrency(getInstallmentValue(selectedVehicle))}
              description={`${getRemainingInstallments(
                selectedVehicle
              )} restantes`}
            />

            <SummaryCard
              theme={theme}
              icon="construct-outline"
              title="Próxima revisão"
              value={getNextReview(selectedVehicle)}
              description="garantia ativa"
            />

            <SummaryCard
              theme={theme}
              icon="bag-handle-outline"
              title="Toyota Shop"
              value="Acessórios"
              description="produtos Toyota"
              onPress={() => router.push("/shop")}
            />
          </View>

          <View style={styles.sectionGrid}>
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={theme.primary}
                />

                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Central de avisos
                </Text>
              </View>

              <Notice
                theme={theme}
                title="Acompanhamento do veículo"
                text={`Seu ${vehicleName} está na etapa: ${vehicleStatus}.`}
              />

              <Notice
                theme={theme}
                title="Financiamento"
                text={`Você possui ${getRemainingInstallments(
                  selectedVehicle
                )} parcela(s) restante(s).`}
              />

              <Notice
                theme={theme}
                title="Garantia"
                text={`Garantia: ${getWarrantyStatus(selectedVehicle)}.`}
              />
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
          <Ionicons name="car-outline" size={42} color={theme.subtext} />

          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Nenhum veículo encontrado
          </Text>

          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            Não encontramos veículos vinculados ao seu perfil.
          </Text>
        </View>
      )}

      <Text style={[styles.footer, { color: theme.subtext }]}>
        © {new Date().getFullYear()} Toyota do Brasil
      </Text>
    </ScrollView>
  );
}

function SummaryCard({ theme, icon, title, value, description, onPress }) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.summaryCard, { backgroundColor: theme.card }]}
    >
      <View
        style={[
          styles.summaryIcon,
          { backgroundColor: `${theme.primary}22` },
        ]}
      >
        <Ionicons name={icon} size={17} color={theme.primary} />
      </View>

      <Text style={[styles.summaryTitle, { color: theme.subtext }]}>
        {title}
      </Text>

      <Text style={[styles.summaryValue, { color: theme.text }]}>
        {value}
      </Text>

      <Text style={[styles.summaryDescription, { color: theme.subtext }]}>
        {description}
      </Text>

      {onPress ? (
        <View style={styles.summaryArrow}>
          <Ionicons name="chevron-forward" size={16} color={theme.primary} />
        </View>
      ) : null}
    </Container>
  );
}

function Notice({ theme, title, text }) {
  return (
    <View style={[styles.notice, { borderColor: theme.box }]}>
      <Text style={[styles.noticeTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.noticeText, { color: theme.subtext }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 110,
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
    marginBottom: 16,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
  },

  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },

  heroInfo: {
    padding: 16,
  },

  heroLabelRow: {
    gap: 8,
    marginBottom: 8,
  },

  heroLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },

  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusChipText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },

  heroSub: {
    marginTop: 4,
    fontSize: 13,
  },

  vehicleSelector: {
    gap: 8,
    marginTop: 14,
  },

  selectorButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  selectorText: {
    fontSize: 12,
    fontWeight: "bold",
  },

  stageBox: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },

  stageLabel: {
    fontSize: 12,
  },

  stageValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "bold",
  },

  stagePercent: {
    fontSize: 13,
    fontWeight: "bold",
  },

  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  heroActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  primaryAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  primaryActionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },

  secondaryAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryActionText: {
    fontWeight: "bold",
    fontSize: 13,
  },

  heroImageArea: {
    minHeight: 180,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },

  heroImage: {
    width: "100%",
    height: 170,
    resizeMode: "contain",
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  summaryCard: {
    width: "48.5%",
    minHeight: 132,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    position: "relative",
  },

  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  summaryTitle: {
    fontSize: 12,
    marginBottom: 5,
  },

  summaryValue: {
    fontSize: 17,
    fontWeight: "bold",
  },

  summaryDescription: {
    marginTop: 4,
    fontSize: 11,
  },

  summaryArrow: {
    position: "absolute",
    right: 10,
    top: 10,
  },

  sectionGrid: {
    gap: 14,
  },

  sectionCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },

  notice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },

  noticeText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
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
    marginBottom: 14,
  },

  errorText: {
    flex: 1,
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },

  emptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
  },

  footer: {
    textAlign: "center",
    marginTop: 22,
    marginBottom: 20,
    fontSize: 12,
  },
});