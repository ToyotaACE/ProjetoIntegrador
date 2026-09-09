import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api").replace(/\/api\/?$/, "");
const API_URL = `${API_ORIGIN}/api`;

const timelineSteps = [
  {
    id: "pedido",
    label: "Pedido Realizado",
    progress: 17,
    icon: "checkmark-outline",
  },
  {
    id: "linha",
    label: "Linha de Produção",
    progress: 33,
    icon: "construct-outline",
  },
  {
    id: "inspecao",
    label: "Inspeção",
    progress: 50,
    icon: "search-outline",
  },
  {
    id: "cegonha",
    label: "Cegonha",
    progress: 67,
    icon: "bus-outline",
  },
  {
    id: "concessionaria",
    label: "Concessionária",
    progress: 83,
    icon: "storefront-outline",
  },
  {
    id: "retirada",
    label: "Pronto para Retirada",
    progress: 100,
    icon: "flag-outline",
  },
];

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
  return vehicle?.anoVeiculo || vehicle?.ano || "Ano não informado";
}

function getVehicleColor(vehicle) {
  return vehicle?.corVeiculo || vehicle?.cor || "Cor não informada";
}

function getVehicleBrand(vehicle) {
  return vehicle?.marcaVeiculo || vehicle?.marca || "Toyota";
}

function getVehicleMotor(vehicle) {
  return vehicle?.motorVeiculo || vehicle?.motor || "Motor não informado";
}

function getVehicleFuel(vehicle) {
  return vehicle?.combustivelVeiculo || vehicle?.combustivel || "Não informado";
}

function getVehicleGear(vehicle) {
  return vehicle?.cambioVeiculo || vehicle?.cambio || "Não informado";
}

function getVehicleChassi(vehicle) {
  return vehicle?.chassiVeiculo || vehicle?.chassi || "Não informado";
}

function getVehiclePlate(vehicle) {
  return vehicle?.placaVeiculo || vehicle?.placa || "Não informada";
}

function getNextReview(vehicle) {
  return (
    vehicle?.dataProximaRevisao ||
    vehicle?.proximaRevisao ||
    "Não informada"
  );
}

function getVehicleProgress(vehicle) {
  const progress =
    vehicle?.progressoVeiculo ??
    vehicle?.progresso ??
    vehicle?.progressoFabricacao ??
    0;

  const parsed = Number(progress);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  if (parsed < 0) {
    return 0;
  }

  if (parsed > 100) {
    return 100;
  }

  return parsed;
}

function getVehicleStatus(vehicle) {
  const progress = getVehicleProgress(vehicle);

  if (progress >= 100) {
    return "PRONTO PARA RETIRADA";
  }

  return (
    vehicle?.statusVeiculo ||
    vehicle?.status ||
    vehicle?.statusFabricacao ||
    "Pedido realizado"
  );
}

function getStatusColorByProgress(progress, theme) {
  if (progress >= 100) {
    return "#16a34a";
  }

  return theme.primary;
}

function buildTimelineByProgress(progress) {
  return timelineSteps.map((step) => ({
    ...step,
    completed: progress >= step.progress,
  }));
}

export default function VehiclePage() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emailLogado = getUserEmail(user);

  const selectedVehicle = useMemo(() => {
    if (!vehicles.length) return null;

    return (
      vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ||
      vehicles[0]
    );
  }, [vehicles, selectedVehicleId]);

  const selectedProgress = getVehicleProgress(selectedVehicle);
  const selectedStatusColor = getStatusColorByProgress(selectedProgress, theme);

  const timeline = useMemo(() => {
    return buildTimelineByProgress(selectedProgress);
  }, [selectedProgress]);

  const completedSteps = timeline.filter((step) => step.completed).length;

  const carregarVeiculos = useCallback(
    async (silent = false) => {
      try {
        setErrorMessage("");

        if (!emailLogado) {
          setVehicles([]);
          setErrorMessage("Cliente não identificado. Faça login novamente.");
          return;
        }

        if (silent) {
          setUpdating(true);
        }

        const responseCliente = await fetch(
          `${API_URL}/clientes/${encodeURIComponent(emailLogado)}`
        );

        if (!responseCliente.ok) {
          throw new Error("Não foi possível buscar os dados do cliente.");
        }

        const clienteData = await responseCliente.json();

        const veiculosCliente = Array.isArray(clienteData?.veiculos)
          ? clienteData.veiculos
          : [];

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
        console.log("Erro ao carregar veículos:", error);
        setErrorMessage("Não foi possível carregar seus veículos.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setUpdating(false);
      }
    },
    [emailLogado, selectedVehicleId]
  );

  useEffect(() => {
    carregarVeiculos(false);
  }, [carregarVeiculos]);

  useEffect(() => {
    const interval = setInterval(() => {
      carregarVeiculos(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [carregarVeiculos]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarVeiculos(false);
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
          Carregando veículos...
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
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              Meus Veículos
            </Text>

            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Selecione um veículo para acompanhar ficha técnica e fabricação.
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

      {vehicles.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
          <Ionicons name="car-outline" size={40} color={theme.subtext} />

          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Nenhum veículo encontrado
          </Text>

          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            Não encontramos veículos vinculados ao seu perfil.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vehicleList}
          >
            {vehicles.map((vehicle) => {
              const selected = selectedVehicle?.id === vehicle.id;
              const progress = getVehicleProgress(vehicle);
              const status = getVehicleStatus(vehicle);

              const cardStatusColor = getStatusColorByProgress(progress, theme);

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
                  onPress={() => handleSelectVehicle(vehicle.id)}
                >
                  <View style={styles.vehicleCardTop}>
                    <View style={styles.vehicleTitleArea}>
                      <Text
                        style={[styles.vehicleName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {getVehicleName(vehicle)}
                      </Text>

                      <Text
                        style={[styles.vehicleSub, { color: theme.subtext }]}
                      >
                        {getVehicleYear(vehicle)} • {getVehicleColor(vehicle)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.smallIconBox,
                        {
                          backgroundColor: `${cardStatusColor}22`,
                        },
                      ]}
                    >
                      <Ionicons
                        name="car-outline"
                        size={18}
                        color={cardStatusColor}
                      />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: cardStatusColor,
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText} numberOfLines={1}>
                      {status}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {getVehicleName(selectedVehicle)}
            </Text>

            <View style={styles.infoGrid}>
              <InfoItem
                label="Marca"
                value={getVehicleBrand(selectedVehicle)}
                theme={theme}
              />

              <InfoItem
                label="Modelo"
                value={getVehicleName(selectedVehicle)}
                theme={theme}
              />

              <InfoItem
                label="Ano"
                value={getVehicleYear(selectedVehicle)}
                theme={theme}
              />

              <InfoItem
                label="Motor"
                value={getVehicleMotor(selectedVehicle)}
                theme={theme}
              />

              <InfoItem
                label="Cor"
                value={getVehicleColor(selectedVehicle)}
                theme={theme}
              />

              <InfoItem
                label="Câmbio"
                value={getVehicleGear(selectedVehicle)}
                theme={theme}
              />

              <InfoItem
                label="Combustível"
                value={getVehicleFuel(selectedVehicle)}
                theme={theme}
              />

              <InfoItem
                label="Chassi"
                value={getVehicleChassi(selectedVehicle)}
                theme={theme}
              />

              <InfoItem
                label="Placa"
                value={getVehiclePlate(selectedVehicle)}
                theme={theme}
              />

              <InfoItem
                label="Próxima revisão"
                value={getNextReview(selectedVehicle)}
                theme={theme}
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.timelineHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Timeline de Fabricação
                </Text>

                <Text style={[styles.timelineSub, { color: theme.subtext }]}>
                  {completedSteps} de {timelineSteps.length} etapas concluídas
                </Text>
              </View>

              {updating ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : null}
            </View>

            <Text style={[styles.progressLabel, { color: theme.subtext }]}>
              Progresso
            </Text>

            <View style={styles.progressHeader}>
              <View
                style={[styles.progressTrack, { backgroundColor: theme.box }]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${selectedProgress}%`,
                      backgroundColor: selectedStatusColor,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.progressText,
                  {
                    color: selectedStatusColor,
                  },
                ]}
              >
                {selectedProgress}%
              </Text>
            </View>

            <View style={styles.timeline}>
              {timeline.map((step, index) => {
                const isLast = index === timeline.length - 1;

                return (
                  <View key={step.id} style={styles.timelineItem}>
                    <View style={styles.timelineMarkerColumn}>
                      <View
                        style={[
                          styles.timelineCircle,
                          {
                            backgroundColor: step.completed
                              ? selectedStatusColor
                              : theme.box,
                          },
                        ]}
                      >
                        <Ionicons
                          name={step.completed ? "checkmark-outline" : step.icon}
                          size={15}
                          color={step.completed ? "#fff" : theme.subtext}
                        />
                      </View>

                      {!isLast && (
                        <View
                          style={[
                            styles.timelineLine,
                            {
                              backgroundColor: step.completed
                                ? selectedStatusColor
                                : theme.box,
                            },
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineTitle,
                          {
                            color: step.completed ? theme.text : theme.subtext,
                          },
                        ]}
                      >
                        {step.label}
                      </Text>

                      <Text
                        style={[
                          styles.timelineDescription,
                          { color: theme.subtext },
                        ]}
                      >
                        {step.completed
                          ? "Etapa concluída"
                          : "Aguardando atualização via IoT"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

      <Text style={[styles.footer, { color: theme.subtext }]}>
        © {new Date().getFullYear()} Toyota do Brasil
      </Text>
    </ScrollView>
  );
}

function InfoItem({ label, value, theme }) {
  return (
    <View style={styles.infoItem}>
      <Text style={[styles.infoLabel, { color: theme.subtext }]}>{label}</Text>

      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
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

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
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

  vehicleList: {
    gap: 10,
    paddingBottom: 16,
  },

  vehicleCard: {
    width: 155,
    minHeight: 122,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    justifyContent: "space-between",
  },

  vehicleCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  vehicleTitleArea: {
    flex: 1,
  },

  smallIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  vehicleName: {
    fontSize: 14,
    fontWeight: "bold",
  },

  vehicleSub: {
    marginTop: 4,
    fontSize: 12,
  },

  statusBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },

  statusBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  infoGrid: {
    marginTop: 14,
    gap: 14,
  },

  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)",
    paddingBottom: 10,
  },

  infoLabel: {
    fontSize: 12,
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
  },

  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  timelineSub: {
    marginTop: 5,
    fontSize: 13,
  },

  progressLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 6,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  progressText: {
    fontSize: 12,
    fontWeight: "bold",
    minWidth: 36,
    textAlign: "right",
  },

  timeline: {
    marginTop: 18,
  },

  timelineItem: {
    flexDirection: "row",
    minHeight: 62,
  },

  timelineMarkerColumn: {
    width: 32,
    alignItems: "center",
  },

  timelineCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 18,
  },

  timelineTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },

  timelineDescription: {
    fontSize: 12,
    marginTop: 3,
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

  footer: {
    textAlign: "center",
    marginTop: 24,
    marginBottom: 20,
    fontSize: 12,
  },
});