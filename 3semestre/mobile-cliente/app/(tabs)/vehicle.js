import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LocalizedText as Text } from "../../components/LocalizedText";

import { useAuth } from "../../contexts/AuthContext";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { useTheme } from "../../contexts/ThemeContext";
import { findNextReviewDate } from "../../utils/vehicleDocuments";

const API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:8083/api").replace(/\/api\/?$/, "");
const API_URL = `${API_ORIGIN}/api`;

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

function getNextReview(vehicle, appointments, language) {
  const nextReview = findNextReviewDate(appointments);
  if (nextReview) {
    const [year, month, day] = nextReview.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(language, {
      timeZone: "UTC",
    });
  }

  return vehicle?.dataProximaRevisao || vehicle?.proximaRevisao || "Não informada";
}

function getUserId(user) {
  return user?.id || user?.clienteId || user?.usuario?.id || null;
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

export default function VehiclePage() {
  const { user } = useAuth();
  const { settings } = useAccessibility();
  const { theme } = useTheme();
  const router = useRouter();

  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emailLogado = getUserEmail(user);
  const clienteId = getUserId(user);

  const selectedVehicle = useMemo(() => {
    if (!vehicles.length) return null;

    return vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

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

        if (clienteId) {
          try {
            const responseAppointments = await fetch(
              `${API_URL}/agendamentos/cliente/${encodeURIComponent(clienteId)}`,
            );
            if (!responseAppointments.ok) throw new Error("appointments");
            const savedAppointments = await responseAppointments.json();
            setAppointments(Array.isArray(savedAppointments) ? savedAppointments : []);
          } catch {
            setAppointments([]);
          }
        } else {
          setAppointments([]);
        }

        if (selectedVehicleId && veiculosCliente.length > 0) {
          const selectedStillExists = veiculosCliente.some(
            (vehicle) => vehicle.id === selectedVehicleId
          );

          if (!selectedStillExists) {
            setSelectedVehicleId(null);
          }
        } else if (veiculosCliente.length === 0) {
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
    [clienteId, emailLogado, selectedVehicleId]
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

  const handleOpenDocuments = (vehicle, event) => {
    event?.stopPropagation?.();
    router.push({
      pathname: "/vehicle-documents",
      params: {
        vehicle: JSON.stringify(vehicle),
        vehicleId: String(vehicle.id),
      },
    });
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
              Selecione um veículo para ver suas informações e opções.
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

                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={(event) => handleOpenDocuments(vehicle, event)}
                    style={[
                      styles.documentsButton,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Ionicons name="document-text-outline" size={15} color="#fff" />
                    <Text style={styles.documentsButtonText}>Documentação</Text>
                  </TouchableOpacity>
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
                value={getNextReview(
                  selectedVehicle,
                  appointments,
                  settings.language,
                )}
                theme={theme}
              />
            </View>
          </View>

          <View style={styles.vehicleActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() =>
                router.push({
                  pathname: "/vehicle-financing",
                  params: { vehicleId: String(selectedVehicle.id) },
                })
              }
            >
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Ver financiamento</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryActionButton,
                { borderColor: theme.box },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/vehicle-timeline",
                  params: { vehicleId: String(selectedVehicle.id) },
                })
              }
            >
              <Ionicons name="git-branch-outline" size={18} color={theme.text} />
              <Text style={[styles.secondaryActionText, { color: theme.text }]}>
                Acompanhar timeline
              </Text>
            </TouchableOpacity>
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
    minHeight: 158,
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

  documentsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
  },

  documentsButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
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

  vehicleActions: {
    gap: 10,
    marginBottom: 14,
  },

  actionButton: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryActionButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },

  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  secondaryActionText: {
    fontSize: 14,
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